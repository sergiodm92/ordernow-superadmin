import '@testing-library/jest-dom';
import { afterEach, beforeEach, expect, vi } from 'vitest';

// Radix (Switch, Checkbox, Select) usa APIs del navegador que jsdom no trae: sin estas, cualquier
// formulario con un interruptor, un tilde o un select falla al renderizar con "X is not defined".
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
}

// Un console.error en un test casi siempre es un aviso de React (un `value` en null, un `key` que
// falta, un setState fuera de act) que nadie lee: se toma como falla. Se junta DENTRO de la
// implementación y no con `spy.mock.calls`: React cambia console.error mientras arma las pilas de
// componentes y esa lista queda vacía aunque el aviso se haya emitido.
let consoleErrors: string[] = [];
let consoleErrorSpy: ReturnType<typeof vi.spyOn> | undefined;

beforeEach(() => {
  consoleErrors = [];
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    consoleErrors.push(String(args[0]).slice(0, 200));
  });
});

afterEach(() => {
  consoleErrorSpy?.mockRestore();
  expect(consoleErrors, 'console.error se llamó durante el test').toEqual([]);
});
