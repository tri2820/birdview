import { BsSearch } from "solid-icons/bs";

export default function SearchInput(props: {
  query: () => string;
  setQuery: (q: string) => void;
  isOpen: () => boolean;
  variant: () => "md" | "lg";
  placeholder: () => string;
}) {
  return <div
    data-variant={props.variant()}
    data-open={props.isOpen()}
    class="relative  h-10 data-[variant=lg]:h-16 data-[open=true]:text-xl data-[open=true]:h-12 data-[open=true]:data-[variant=lg]:h-20   group "
  >
    <div
      data-open={props.isOpen()}
      class="absolute top-1/2 -translate-y-1/2 left-0 h-full flex items-center pl-4 data-[open=true]:pl-4 "
    >
      <BsSearch
        data-open={props.isOpen()}
        class="w-5 h-5 data-[open=true]:w-6 data-[open=true]:h-6 text-neutral-400 group-hover:text-white  transition-all duration-100 "
      />
    </div>

    <div
      data-open={props.isOpen()}
      class="h-full flex items-center justify-center data-[open=true]:justify-end"
    >
      <input
        value={props.query()}
        onInput={(e) => {
          props.setQuery(e.currentTarget.value);
        }}
        data-open={props.isOpen()}
        data-variant={props.variant()}
        class="w-[calc(100%-3rem)] 
                  data-[variant=lg]:text-xl
                  h-full  placeholder:text-neutral-400  transition-all duration-100  px-2 focus:outline-none text-center data-[open=true]:text-left min-w-0"
        placeholder={props.isOpen() ? "" : props.placeholder()}
      />
    </div>
  </div>
}