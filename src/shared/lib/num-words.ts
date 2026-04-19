export const numWords = (number: number, variants: string[]): string => {
    const lastDigit = Math.abs(number) % 10;
    const lastTwoDigits = Math.abs(number) % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return variants[2];
    }

    if (lastDigit === 1) {
        return variants[0];
    } else if (lastDigit >= 2 && lastDigit <= 4) {
        return variants[1];
    } else {
        return variants[2];
    }
};
