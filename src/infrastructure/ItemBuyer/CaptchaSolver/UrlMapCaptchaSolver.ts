import { Result, Ok, Err } from "@core/result";
import { CaptchaCoordinate, ICaptchaSolver } from "./ICaptchaSolver";

export class UrlMapCaptchaSolver implements ICaptchaSolver {
    constructor (private urlMap: Record<string, CaptchaCoordinate>){}
    
    solve(imageUrl: string): Promise<Result<CaptchaCoordinate>> {
        return new Promise((resolve) => {
            const coord = this.urlMap[imageUrl];
            if (!coord){
                resolve(Err.from(new Error(`CaptchaImg "${imageUrl}" is not in cache`)));
            }

            resolve(Ok.from(coord))
        })
    }
}