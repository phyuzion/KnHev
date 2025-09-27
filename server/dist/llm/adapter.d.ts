export type GenerateArgs = {
    prompt: string;
    locale?: 'ko' | 'en';
    system?: string;
};
export declare function generateText({ prompt, locale, system }: GenerateArgs): Promise<string>;
//# sourceMappingURL=adapter.d.ts.map