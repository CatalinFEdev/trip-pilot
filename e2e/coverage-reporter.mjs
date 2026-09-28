import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import v8ToIstanbul from 'v8-to-istanbul';
import istanbulCoverage from 'istanbul-lib-coverage';

const { createCoverageMap } = istanbulCoverage;

const directory = resolve('coverage/e2e');
const rawDirectory = resolve(directory, 'raw');
const threshold = 85;

export default class CoverageReporter {
  async onBegin() {
    await rm(rawDirectory, { recursive: true, force: true });
  }

  async onEnd(result) {
    const map = createCoverageMap({});
    const files = await readdir(rawDirectory).catch((error) => {
      if (error.code === 'ENOENT') throw new Error('No passing browser tests produced coverage');
      throw error;
    });
    for (const file of files) {
      const entries = JSON.parse(await readFile(resolve(rawDirectory, file), 'utf8'));
      for (const entry of entries) {
        if (!entry.url || !entry.source || !entry.functions.length || entry.url.includes('/@fs/')) {
          continue;
        }
        const markers = [...entry.source.matchAll(/[#@] sourceMappingURL=([^\s]+)/g)];
        const marker = markers.at(-1)?.[1];
        if (!marker) continue;
        let sourceMap;
        if (marker.startsWith('data:application/json;base64,')) {
          sourceMap = JSON.parse(Buffer.from(marker.split(',')[1], 'base64').toString('utf8'));
        } else {
          const url = new URL(marker, entry.url);
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Cannot fetch source map ${url}: ${response.status}`);
          sourceMap = await response.json();
        }
        if (!sourceMap.sources?.some((source) => source.includes('src/app/'))) continue;

        const converter = v8ToIstanbul(
          entry.url,
          0,
          { source: entry.source, sourceMap: { sourcemap: sourceMap } },
          (path) => !path.replaceAll('\\', '/').includes('src/app/'),
        );
        await converter.load();
        converter.applyCoverage(entry.functions);
        map.merge(converter.toIstanbul());
      }
    }

    await writeFile(resolve(directory, 'coverage-final.json'), JSON.stringify(map.toJSON(), null, 2));
    const sourceFiles = map.files().filter((file) => file.endsWith('.ts'));
    let covered = 0;
    let total = 0;
    for (const file of sourceFiles) {
      const lines = map.fileCoverageFor(file).toSummary().lines;
      covered += lines.covered;
      total += lines.total;
      console.log(`  ${file.replaceAll('\\', '/').split('src/app/')[1]}: ${lines.pct}%`);
    }
    const pct = total ? Math.round((covered / total) * 10000) / 100 : 0;
    console.log(`E2E TypeScript line coverage: ${pct}% (${covered}/${total}), minimum ${threshold}%`);
    const sourceRoot = resolve('src/app');
    const candidates = await readdir(sourceRoot, { recursive: true });
    const runtimeFiles = [];
    for (const path of candidates.filter(
      (path) => path.endsWith('.ts') && !path.endsWith('.spec.ts'),
    )) {
      const content = await readFile(resolve(sourceRoot, path), 'utf8');
      if (/\bexport (?:const|class|function)\b|@Injectable|@Component/.test(content)) {
        runtimeFiles.push(path.replaceAll('\\', '/'));
      }
    }
    const missing = runtimeFiles.filter(
      (path) => !sourceFiles.some(
        (file) => file.replaceAll('\\', '/').endsWith(`/src/app/${path}`),
      ),
    );
    if (missing.length) console.error(`Missing runtime source coverage: ${missing.join(', ')}`);
    if (result.status !== 'passed' || missing.length || pct < threshold) {
      return { status: 'failed' };
    }
  }
}
