export default function LoadingSkeleton() {
    return <div class="w-full p-4">
        <div class="flex animate-pulse space-x-4">
            <div class="flex-1 space-y-6 py-1">
                <div class="h-4 rounded bg-neutral-800"></div>
                <div class="space-y-3">
                    <div class="grid grid-cols-3 gap-4">
                        <div class="col-span-2 h-4 rounded bg-neutral-800"></div>
                        <div class="col-span-1 h-4 rounded bg-neutral-800"></div>
                    </div>
                    <div class="h-4 rounded bg-neutral-800"></div>
                </div>
            </div>
        </div>
    </div>
}