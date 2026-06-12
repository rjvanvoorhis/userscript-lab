/**
 * Left-pads {@link num} with zeros to {@link totalLength} characters.
 *
 * @example
 * padWithLeadingZeros(7, 3)  // '007'
 * padWithLeadingZeros(42)    // '42'
 */
export const padWithLeadingZeros = (num: number, totalLength = 0): string =>
  String(num).padStart(totalLength, '0');
