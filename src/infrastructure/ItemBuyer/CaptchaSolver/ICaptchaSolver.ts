import type { Result } from "@core/result";

export type CaptchaCoordinate = {
    x: number;
    y: number;
}

export interface ICaptchaSolver {
    solve(imageUrl: string): Promise<Result<CaptchaCoordinate>>
}