import { toPng, toSvg } from 'html-to-image';

export async function exportAsPng(
  element: HTMLElement,
  filename = 'git-floww.png',
  backgroundColor = '#080b14'
) {
  const dataUrl = await toPng(element, {
    backgroundColor,
    pixelRatio: 2,
  });
  download(dataUrl, filename);
}

export async function exportAsSvg(
  element: HTMLElement,
  filename = 'git-floww.svg',
  backgroundColor = '#080b14'
) {
  const dataUrl = await toSvg(element, {
    backgroundColor,
  });
  download(dataUrl, filename);
}

function download(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
