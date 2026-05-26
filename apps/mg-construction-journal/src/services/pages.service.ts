import type { PageEntity } from '@mg-nx-forge/mg-router-zustand-1';
import { lazy } from 'react';

export const homePage: PageEntity = {
    title: 'Journal',
    desk: 'Work log',
    url: '/',
};

const settingsPage: PageEntity = {
    title: 'Roads',
    desk: 'Manage roads',
    url: '/settings',
};

export const pagesInfo: PageEntity[] = [homePage, settingsPage];

export const pagesComponents: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
    '/': lazy(() => import('@/pages/HomePage')),
    '/settings': lazy(() => import('@/pages/SettingsPage')),
};
