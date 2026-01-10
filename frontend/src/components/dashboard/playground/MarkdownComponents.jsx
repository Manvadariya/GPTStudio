import React from 'react';

export const CustomTable = ({ children, ...props }) => (
    <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 shadow-sm bg-white scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        <table className="min-w-full divide-y divide-slate-200" {...props}>
            {children}
        </table>
    </div>
);

export const CustomThead = ({ children, ...props }) => (
    <thead className="bg-slate-50" {...props}>
        {children}
    </thead>
);

export const CustomTbody = ({ children, ...props }) => (
    <tbody className="divide-y divide-slate-200 bg-white" {...props}>
        {children}
    </tbody>
);

export const CustomTr = ({ children, ...props }) => (
    <tr className="hover:bg-slate-50/50 transition-colors" {...props}>
        {children}
    </tr>
);

export const CustomTh = ({ children, ...props }) => (
    <th
        className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider bg-slate-100/50 first:pl-4 last:pr-4"
        {...props}
    >
        {children}
    </th>
);

export const CustomTd = ({ children, ...props }) => (
    <td
        className="px-4 py-2.5 text-sm text-slate-700 first:min-w-[140px] first:font-medium first:text-slate-900 first:pl-4 last:pr-4 align-top leading-relaxed"
        {...props}
    >
        {children}
    </td>
);
