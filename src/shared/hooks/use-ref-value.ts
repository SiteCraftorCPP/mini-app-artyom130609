import { useRef } from 'react';

export const useRefValue = <T>(initialValue: T): [T, (newValue: T) => void] => {
    const ref = useRef<T>(initialValue);

    const setValue = (newValue: T) => {
        ref.current = newValue;
    };

    return [ref.current, setValue] as const;
};
