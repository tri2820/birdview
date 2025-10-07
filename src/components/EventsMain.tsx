import { createSignal, onMount, For } from 'solid-js';
import { MediaUnit } from '../../types';
import { FaSolidArrowsRotate, FaSolidChevronLeft, FaSolidChevronRight } from 'solid-icons/fa';
import { appConfig } from '../utils';
type PaginationResponse = {
    items: MediaUnit[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
};

export default function EventsMain() {
    const [mediaUnits, setMediaUnits] = createSignal<MediaUnit[]>([]);
    const [pagination, setPagination] = createSignal({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    });
    const [loading, setLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);

    const fetchMediaUnits = async (page: number = 1, limit: number = 10) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/v1/media-unit?page=${page}&limit=${limit}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
            }

            const data: PaginationResponse = await response.json();
            setMediaUnits(data.items);
            setPagination({
                page: data.pagination.page,
                limit: data.pagination.limit,
                total: data.pagination.total,
                totalPages: data.pagination.totalPages,
                hasNextPage: data.pagination.hasNextPage,
                hasPrevPage: data.pagination.hasPrevPage,
            });
        } catch (err) {
            console.error('Error fetching media units:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        const totalPages = pagination().totalPages;
        if (newPage >= 1 && newPage <= totalPages) {
            fetchMediaUnits(newPage, pagination().limit);
        }
    };

    const handleNextPage = () => {
        const current = pagination().page;
        const totalPages = pagination().totalPages;
        if (current < totalPages) {
            handlePageChange(current + 1);
        }
    };

    const handlePrevPage = () => {
        const current = pagination().page;
        if (current > 1) {
            handlePageChange(current - 1);
        }
    };

    onMount(() => {
        fetchMediaUnits();
    });

    return (
        <div class="h-screen flex flex-col border-l border-neutral-800 bg-neutral-900">
            <div class="flex-none px-4 py-4 text-lg bg-neutral-900 border-b border-neutral-800">
                <div class="flex items-center justify-between">
                    <div class="text-white font-bold">Events</div>
                    <button
                        onClick={() => fetchMediaUnits(pagination().page, pagination().limit)}
                        disabled={loading()}
                        class="btn-secondary"
                        title="Refresh events"
                    >
                        <FaSolidArrowsRotate class="w-4 h-4" />
                        <span class="text-sm">Refresh</span>
                    </button>
                </div>
            </div>
            <div class="px-4 py-3 border-b border-neutral-800 bg-neutral-900">
                {/* Pagination Controls */}
                <div class="flex items-center justify-between sm:items-center">
                    <div class="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={handlePrevPage}
                            disabled={!pagination().hasPrevPage || loading()}
                            class={`relative inline-flex items-center px-4 py-2 border border-neutral-800 text-sm font-medium rounded-md ${pagination().hasPrevPage && !loading()
                                ? 'text-white bg-neutral-800 hover:bg-neutral-700 cursor-pointer'
                                : 'text-neutral-500 bg-neutral-900 cursor-not-allowed'
                                }`}
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={!pagination().hasNextPage || loading()}
                            class={`ml-3 relative inline-flex items-center px-4 py-2 border border-neutral-800 text-sm font-medium rounded-md ${pagination().hasNextPage && !loading()
                                ? 'text-white bg-neutral-800 hover:bg-neutral-700 cursor-pointer'
                                : 'text-neutral-500 bg-neutral-900 cursor-not-allowed'
                                }`}
                        >
                            Next
                        </button>
                    </div>
                    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p class="text-sm text-neutral-400">
                                Showing <span class="font-medium">{(pagination().page - 1) * pagination().limit + 1}</span> to{' '}
                                <span class="font-medium">
                                    {Math.min(pagination().page * pagination().limit, pagination().total)}
                                </span>{' '}
                                of <span class="font-medium">{pagination().total}</span> results
                            </p>
                        </div>
                        <div>
                            <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={!pagination().hasPrevPage || loading()}
                                    class={`relative inline-flex items-center border border-neutral-800 px-2 py-2 rounded-l-md text-sm font-medium focus:z-20 ${pagination().hasPrevPage && !loading()
                                        ? 'text-neutral-300 bg-neutral-800  hover:bg-neutral-700 cursor-pointer'
                                        : 'text-neutral-500 bg-neutral-800/50  cursor-not-allowed'
                                        }`}
                                >
                                    <span class="sr-only">Previous</span>
                                    <FaSolidChevronLeft class="w-4 h-4" />
                                </button>

                                <For each={Array.from({ length: Math.min(5, pagination().totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (pagination().totalPages <= 5) {
                                        // Show all pages if total pages <= 5
                                        pageNum = i + 1;
                                    } else if (pagination().page <= 3) {
                                        // Show first 5 pages if current page is in first 3
                                        pageNum = i + 1;
                                    } else if (pagination().page >= pagination().totalPages - 2) {
                                        // Show last 5 pages if current page is in last 3
                                        pageNum = pagination().totalPages - 4 + i;
                                    } else {
                                        // Show pages around current page
                                        pageNum = pagination().page - 2 + i;
                                    }

                                    return pageNum;
                                })}>
                                    {(pageNum) => (
                                        <button
                                            onClick={() => handlePageChange(pageNum)}
                                            disabled={loading()}
                                            class={`relative inline-flex items-center px-4 py-2 text-sm font-medium focus:z-20 ${pagination().page === pageNum && !loading()
                                                ? 'z-10 bg-[#6c32fe] text-white border-transparent'
                                                : loading()
                                                    ? 'text-neutral-500 bg-neutral-900 cursor-not-allowed border-neutral-800'
                                                    : 'text-neutral-300 bg-neutral-800 border-neutral-800 hover:bg-neutral-700 cursor-pointer'
                                                } border-t border-b`}
                                        >
                                            <div class="w-3">
                                                {pageNum}
                                            </div>
                                        </button>
                                    )}
                                </For>

                                <button
                                    onClick={handleNextPage}
                                    disabled={!pagination().hasNextPage || loading()}
                                    class={`relative inline-flex items-center border border-neutral-800 px-2 py-2 rounded-r-md text-sm font-medium focus:z-20 ${pagination().hasNextPage && !loading()
                                        ? 'text-neutral-300 bg-neutral-800  hover:bg-neutral-700 cursor-pointer'
                                        : 'text-neutral-500 bg-neutral-800/50 cursor-not-allowed'
                                        }`}
                                >
                                    <span class="sr-only">Next</span>
                                    <FaSolidChevronRight class="w-4 h-4" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex-1 overflow-auto">
                <div class="overflow-x-auto">
                    <div class="max-h-full  overflow-y-auto">
                        <table class="min-w-full table-auto">
                            <thead class="bg-neutral-800 sticky top-0 z-10">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Media ID</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Time</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Description</th>

                                </tr>
                            </thead>
                            <tbody class="bg-neutral-900 divide-y divide-neutral-800">
                                {loading() ? (
                                    <tr>
                                        <td colspan="3" class="px-6 py-12 text-center text-neutral-400">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : error() ? (
                                    <tr>
                                        <td colspan="3" class="px-6 py-12 text-center text-red-500">
                                            Error: {error()}
                                        </td>
                                    </tr>
                                ) : mediaUnits().length > 0 ? (
                                    <For each={mediaUnits()}>
                                        {(unit) => {
                                            const label = appConfig()?.streams[unit.media_id]?.label || unit.media_id;
                                            return <tr class="hover:bg-neutral-800 transition-colors">
                                                <td class="px-6 py-4 text-sm text-neutral-300">
                                                    {label()}
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                                                    {new Date(unit.at_time).toLocaleString()}
                                                </td>
                                                <td class="px-6 py-4 text-sm text-neutral-300 max-w-md">
                                                    {unit.description || <span class="text-neutral-500 italic">No description</span>}
                                                </td>

                                            </tr>
                                        }}
                                    </For>
                                ) : (
                                    <tr>
                                        <td colspan="3" class="px-6 py-12 text-center text-neutral-400">
                                            No events found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}