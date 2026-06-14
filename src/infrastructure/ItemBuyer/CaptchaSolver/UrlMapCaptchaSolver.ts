import { Result, Ok, Err, attemptAsync } from "@core/result";
import { CaptchaCoordinate, ICaptchaSolver } from "./ICaptchaSolver";
import CryptoJS from "crypto-js";

function hashFn(buffer: ArrayBuffer) {
  const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(buffer));
  return CryptoJS.MD5(wordArray).toString();
}

function getRandomInt(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

type BoundingBox = {
  lowX: number;
  highX: number;
  lowY: number;
  highY: number;
};

export class UrlMapCaptchaSolver implements ICaptchaSolver {
  constructor(private readonly hashMap: Record<string, BoundingBox>) {}

  private async urlToHash(url: string) {
    return attemptAsync(async () => {
      const result = await fetch(url);
      return hashFn(await result.arrayBuffer());
    });
  }

  async solve(url: string): Promise<Result<CaptchaCoordinate>> {
    return (await this.urlToHash(url)).chain<CaptchaCoordinate>((key) => {
      const box = this.hashMap[key];

      if (!box) {
        return Err.from<CaptchaCoordinate>(
          new Error(`Image "${url}" not found in cache`),
        );
      }

      return Ok.from<CaptchaCoordinate>({
        x: getRandomInt(box.lowX, box.highX),
        y: getRandomInt(box.lowY, box.highY),
      });
    });
  }
}
