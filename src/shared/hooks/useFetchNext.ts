import { useEffect, useState } from 'react';

export const useFetchNext = <T extends HTMLElement = HTMLDivElement>(
    hasNextPage: boolean | undefined,
    isFetchingNextPage: boolean,
    fetchNextPage: () => void
) => {
    const [element, setElement] = useState<T | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 1 }
        );

        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [element, hasNextPage, isFetchingNextPage, fetchNextPage]);

    return setElement;
};
