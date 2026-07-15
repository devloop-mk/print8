import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');

if (typeof globalThis.DOMParser === 'undefined') {
  globalThis.DOMParser = dom.window.DOMParser;
}

if (typeof globalThis.XMLSerializer === 'undefined') {
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}
