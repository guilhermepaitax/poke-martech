// Efeitos dos ataques especiais vivos na cena. Cada um avança pelo delta do
// quadro e devolve `true` quando terminou; `destroy` limpa tudo na hora.
type SpecialFx = {
  step: (deltaMs: number) => boolean;
  destroy: () => void;
};

function stepSpecials(bucket: SpecialFx[], deltaMs: number) {
  for (const fx of [...bucket]) {
    if (!fx.step(deltaMs)) continue;
    fx.destroy();
    const index = bucket.indexOf(fx);
    if (index >= 0) bucket.splice(index, 1);
  }
}

function clearSpecials(bucket: SpecialFx[]) {
  for (const fx of bucket) fx.destroy();
  bucket.length = 0;
}

export { clearSpecials, stepSpecials };
export type { SpecialFx };
