type TypographyTextProps = { text?: string };

type TypographyTableProps = {
    headers?: string[];
    rows?: string[][];
};

type TypographyListProps = { items?: string[] };

export function TypographyH1({ text }: TypographyTextProps = {}) {
    // return <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">{text}</h1>;
    return <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">{text}</h1>;
}

export function TypographyH2({ text }: TypographyTextProps = {}) {
    return <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">{text}</h2>;
}

export function TypographyH3({ text }: TypographyTextProps = {}) {
    return <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{text}</h3>;
}

export function TypographyH4({ text }: TypographyTextProps = {}) {
    return <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">{text}</h4>;
}

export function TypographyP({ text }: TypographyTextProps = {}) {
    return <p className="leading-7 [&:not(:first-child)]:mt-6">{text}</p>;
}

export function TypographyBlockquote({ text }: TypographyTextProps = {}) {
    return <blockquote className="mt-6 border-l-2 pl-6 italic">{text}</blockquote>;
}

export function TypographyTable({ headers, rows }: TypographyTableProps = {}) {
    return (
        <div className="my-6 w-full overflow-y-auto">
            <table className="w-full">
                {headers && (
                    <thead>
                        <tr className="m-0 border-t p-0 even:bg-muted">
                            {headers.map((header) => (
                                <th
                                    key={header}
                                    className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                )}
                <tbody>
                    {rows?.map((row) => (
                        <tr key={row.join('-')} className="m-0 border-t p-0 even:bg-muted">
                            {row.map((cell) => (
                                <td
                                    key={cell}
                                    className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function TypographyList({ items }: TypographyListProps = {}) {
    return (
        <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            {items?.map((item) => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    );
}

export function TypographyInlineCode({ text }: TypographyTextProps = {}) {
    return (
        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
            {text}
        </code>
    );
}

export function TypographyLead({ text }: TypographyTextProps = {}) {
    return <p className="text-xl text-muted-foreground">{text}</p>;
}

export function TypographyLarge({ text }: TypographyTextProps = {}) {
    return <div className="text-lg font-semibold">{text}</div>;
}

export function TypographySmall({ text }: TypographyTextProps = {}) {
    return <small className="text-sm leading-none font-medium">{text}</small>;
}

export function TypographyMuted({ text }: TypographyTextProps = {}) {
    return <p className="text-sm text-muted-foreground">{text}</p>;
}
