import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TypographyH1, TypographyMuted } from './ui/typography';

interface CardCoreEntity {
    children: ReactNode;
}

interface PLBlockEntity {
    title?: string;
    children: ReactNode;
    className?: string;
    containerClassName?: string;
}

interface PLCardEntity {
    title?: string;
    desk?: string;
    children: ReactNode;
}

export function PLWrapper({ children }: CardCoreEntity) {
    return <div className="main-page-wrapper">{children}</div>;
}

export function PLBlock({ title, children, className, containerClassName }: PLBlockEntity) {
    return (
        <div
            className={cn(
                'mx-auto flex w-full max-w-lg min-w-0 flex-col gap-1 self-stretch lg:max-w-none',
                containerClassName
            )}
        >
            {title && <span className="ml-1 text-sm font-medium text-muted-foreground">{title}</span>}
            <div
                data-slot="example-content"
                className={cn(
                    "bg-background text-foreground flex min-w-0 flex-1 flex-col items-start gap-6 border p-4 sm:p-6 *:[div:not([class*='w-'])]:w-full",
                    className
                )}
            >
                {children}
            </div>
        </div>
    );
}

export function PLCard({ title, desk, children }: PLCardEntity) {
    return (
        <Card className="mx-auto w-full max-w-lg gap-4">
            {title && desk && (
                <CardHeader>
                    {title && <CardTitle>{title}</CardTitle>}
                    {desk && <CardDescription>{desk}</CardDescription>}
                </CardHeader>
            )}
            <CardContent>{children}</CardContent>
        </Card>
    );
}

export function PLArea({ title, desk, children }: PLCardEntity) {
    return (
        <div className="mx-auto w-full p-16 grid gap-4">
            {title && desk && (
                <div className="grid gap-4">
                    {title && <TypographyH1 text={title} />}
                    {desk && <TypographyMuted text={desk} />}
                </div>
            )}
            <div>{children}</div>
        </div>
    );
}

export function PLFullBlock({ title, desk, children }: PLCardEntity) {
    return (
        <PLWrapper>
            <PLBlock>
                {title && desk ? (
                    <PLArea title={title} desk={desk}>
                        {children}
                    </PLArea>
                ) : (
                    children
                )}
            </PLBlock>
        </PLWrapper>
    );
}
