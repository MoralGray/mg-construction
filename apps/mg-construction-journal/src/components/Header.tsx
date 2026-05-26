import { type PageEntity, useRedirect, useRouterStorage } from '@mg-nx-forge/mg-router-zustand-1';
import { Button, cn, ModeToggle } from '@mg-nx-forge/mg-ui-shadcn-4';
import { homePage, pagesInfo } from '@/services/pages.service';

export function Header() {
    const { currentPage, setCurrentPage } = useRouterStorage();
    const { redirect } = useRedirect();
    const selectedPage = currentPage ?? homePage;

    const headerClick = (page: PageEntity) => {
        setCurrentPage(page);
        redirect(page);
    };

    return (
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
            <span className="text-lg font-bold">MG Construction Journal</span>
            <nav className="flex gap-4">
                {pagesInfo.map((page) => (
                    <Button
                        variant="ghost"
                        key={page.url}
                        onClick={() => headerClick(page)}
                        className={cn(selectedPage === page && 'underline')}
                    >
                        {page.title}
                    </Button>
                ))}
                <ModeToggle />
            </nav>
        </header>
    );
}
