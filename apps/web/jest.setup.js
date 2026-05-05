const { TextEncoder, TextDecoder } = require('util');
const { ReadableStream, TransformStream, WritableStream } = require('stream/web');
const { BroadcastChannel } = require('worker_threads');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;
global.TransformStream = TransformStream;
global.WritableStream = WritableStream;
global.BroadcastChannel = BroadcastChannel;

const { Request, Response, fetch, Headers } = require('undici');

// MSW 2.0 requires these globals in Node/JSDOM
global.Request = Request;
global.Response = Response;
global.fetch = fetch;
global.Headers = Headers;

require('@testing-library/jest-dom');
