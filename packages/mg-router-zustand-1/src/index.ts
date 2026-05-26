import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';

export interface PageEntity {
    title: string;
    desk?: string;
    url: string;
}

interface RouterEntity {
    currentPage: PageEntity | null;
    getCurrentPageTitle: () => string | undefined;
    setCurrentPage: (page: PageEntity) => void;
}

export const useRouterStorage = create<RouterEntity>()((set, get) => ({
    currentPage: null,
    getCurrentPageTitle: () => {
        const { currentPage } = get();
        return currentPage?.title;
    },
    setCurrentPage: (page: PageEntity) =>
        set(() => ({
            currentPage: page,
            // pagesHistory: [...state.pagesHistory, page]
        })),
}));

export const initializeCurrentPage = (pages: PageEntity[]) => {
    const pathname = window.location.pathname;
    const match = pages.find((page) => page.url === pathname);
    if (match) {
        useRouterStorage.getState().setCurrentPage(match);
    }
};

export const useRedirect = () => {
    const navigate = useNavigate();
    const { setCurrentPage } = useRouterStorage();

    const redirect = (page: PageEntity, opt?: Record<string, string | number | boolean | undefined>) => {
        let url = page.url;

        if (opt && Object.keys(opt).length > 0) {
            const queryString = new URLSearchParams();
            for (const [key, value] of Object.entries(opt)) {
                if (value !== undefined) {
                    queryString.append(key, String(value));
                }
            }
            url += `?${queryString.toString()}`;
        }

        navigate(url);
        setCurrentPage(page);
        console.log('page', page);
    };

    return { redirect };
};
