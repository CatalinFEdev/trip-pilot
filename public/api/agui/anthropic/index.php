<?php

declare(strict_types=1);

const DEFAULT_MODEL = 'claude-sonnet-4-5';
const DEFAULT_MAX_TOKENS = 4096;

header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache, no-transform');
header('X-Accel-Buffering: no');

while (ob_get_level() > 0) {
    ob_end_flush();
}

function emitEvent(array $event): void
{
    echo 'data: ', json_encode($event, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), "\n\n";
    flush();
}

function runError(string $message, ?string $code = null): void
{
    $event = ['type' => 'RUN_ERROR', 'message' => $message];
    if ($code !== null) {
        $event['code'] = $code;
    }

    emitEvent($event);
    exit;
}

function stringValue($value): string
{
    return is_string($value) ? $value : '';
}

function decodeToolArguments($value)
{
    if (!is_string($value) || $value === '') {
        return new stdClass();
    }

    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : new stdClass();
}

function anthropicMessages(array $messages): array
{
    $system = [];
    $result = [];

    foreach ($messages as $message) {
        if (!is_array($message)) {
            continue;
        }

        $role = $message['role'] ?? '';
        if ($role === 'system' || $role === 'developer') {
            $content = stringValue($message['content'] ?? '');
            if ($content !== '') {
                $system[] = $content;
            }
            continue;
        }

        if ($role === 'user') {
            $result[] = ['role' => 'user', 'content' => stringValue($message['content'] ?? '')];
            continue;
        }

        if ($role === 'assistant') {
            $blocks = [];
            $content = stringValue($message['content'] ?? '');
            if ($content !== '') {
                $blocks[] = ['type' => 'text', 'text' => $content];
            }

            foreach (($message['toolCalls'] ?? []) as $call) {
                if (!is_array($call)) {
                    continue;
                }
                $function = is_array($call['function'] ?? null) ? $call['function'] : [];
                $blocks[] = [
                    'type' => 'tool_use',
                    'id' => stringValue($call['id'] ?? ''),
                    'name' => stringValue($function['name'] ?? ''),
                    'input' => decodeToolArguments($function['arguments'] ?? ''),
                ];
            }

            if ($blocks !== []) {
                $result[] = ['role' => 'assistant', 'content' => $blocks];
            }
            continue;
        }

        if ($role === 'tool') {
            $result[] = [
                'role' => 'user',
                'content' => [[
                    'type' => 'tool_result',
                    'tool_use_id' => stringValue($message['toolCallId'] ?? ''),
                    'content' => stringValue($message['content'] ?? ''),
                ]],
            ];
        }
    }

    return [
        'system' => $system === [] ? null : implode("\n\n", $system),
        'messages' => $result,
    ];
}

function anthropicTools($tools): array
{
    if (!is_array($tools)) {
        return [];
    }

    $result = [];
    foreach ($tools as $tool) {
        if (!is_array($tool)) {
            continue;
        }

        $result[] = [
            'name' => stringValue($tool['name'] ?? ''),
            'description' => stringValue($tool['description'] ?? ''),
            'input_schema' => is_array($tool['parameters'] ?? null)
                ? $tool['parameters']
                : ['type' => 'object'],
        ];
    }

    return $result;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    runError('Only POST requests are supported.', 'method_not_allowed');
}

$apiKey = getenv('ANTHROPIC_API_KEY');
if ($apiKey === false || trim($apiKey) === '') {
    runError('ANTHROPIC_API_KEY is not configured on the server.', 'configuration_error');
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput === false ? '' : $rawInput, true);
if (!is_array($input) || !is_array($input['messages'] ?? null)) {
    runError('The request must contain a messages array.', 'invalid_request');
}

$threadId = stringValue($input['threadId'] ?? '');
$runId = stringValue($input['runId'] ?? '');
emitEvent([
    'type' => 'RUN_STARTED',
    'threadId' => $threadId,
    'runId' => $runId,
]);

$converted = anthropicMessages($input['messages']);
$payload = [
    'model' => getenv('ANTHROPIC_MODEL') ?: DEFAULT_MODEL,
    'max_tokens' => (int) (getenv('ANTHROPIC_MAX_TOKENS') ?: DEFAULT_MAX_TOKENS),
    'messages' => $converted['messages'],
];

if ($converted['system'] !== null) {
    $payload['system'] = $converted['system'];
}

$tools = anthropicTools($input['tools'] ?? null);
if ($tools !== []) {
    $payload['tools'] = $tools;
}

if (!function_exists('curl_init')) {
    runError('The PHP cURL extension is not enabled on the server.', 'configuration_error');
}

$curl = curl_init('https://api.anthropic.com/v1/messages');
if ($curl === false) {
    runError('Could not initialize the Anthropic request.', 'server_error');
}

curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_TIMEOUT => 120,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-Api-Key: ' . trim($apiKey),
        'Anthropic-Version: 2023-06-01',
    ],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES),
]);

$responseBody = curl_exec($curl);
$curlError = curl_error($curl);
$status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
curl_close($curl);

if (!is_string($responseBody)) {
    runError('Anthropic request failed: ' . $curlError, 'upstream_error');
}

$response = json_decode($responseBody, true);
if ($status < 200 || $status >= 300) {
    $message = is_array($response)
        ? stringValue($response['error']['message'] ?? '')
        : '';
    runError(
        $message !== '' ? 'Anthropic rejected the request: ' . $message : 'Anthropic returned HTTP ' . $status . '.',
        $status === 400 && stripos($message, 'credit balance is too low') !== false
            ? 'insufficient_credits'
            : 'upstream_error',
    );
}

if (!is_array($response) || !is_array($response['content'] ?? null)) {
    runError('Anthropic returned an invalid response.', 'upstream_error');
}

foreach ($response['content'] as $block) {
    if (!is_array($block)) {
        continue;
    }

    if (($block['type'] ?? '') === 'text' && stringValue($block['text'] ?? '') !== '') {
        $messageId = bin2hex(random_bytes(16));
        emitEvent(['type' => 'TEXT_MESSAGE_START', 'messageId' => $messageId, 'role' => 'assistant']);
        emitEvent([
            'type' => 'TEXT_MESSAGE_CONTENT',
            'messageId' => $messageId,
            'delta' => stringValue($block['text']),
        ]);
        emitEvent(['type' => 'TEXT_MESSAGE_END', 'messageId' => $messageId]);
        continue;
    }

    if (($block['type'] ?? '') === 'tool_use') {
        $toolCallId = stringValue($block['id'] ?? '');
        emitEvent([
            'type' => 'TOOL_CALL_START',
            'toolCallId' => $toolCallId,
            'toolCallName' => stringValue($block['name'] ?? ''),
        ]);
        emitEvent([
            'type' => 'TOOL_CALL_ARGS',
            'toolCallId' => $toolCallId,
            'delta' => json_encode($block['input'] ?? new stdClass(), JSON_UNESCAPED_SLASHES),
        ]);
        emitEvent(['type' => 'TOOL_CALL_END', 'toolCallId' => $toolCallId]);
    }
}

emitEvent([
    'type' => 'RUN_FINISHED',
    'threadId' => $threadId,
    'runId' => $runId,
]);
