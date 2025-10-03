import { BsSearch } from "solid-icons/bs";
import { FaSolidCloud } from "solid-icons/fa";
import { VsDeviceCamera, VsSearch } from "solid-icons/vs";
import { createMessage, parseMessage } from "../../message";
import { format } from "date-fns";
import {
  createEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
  untrack,
} from "solid-js";
import {
  cachedImages,
  config,
  latestWsMessage,
  setCachedImages,
  socket,
} from "../utils";
import { BiSolidCctv } from "solid-icons/bi";

function NoResultIcon() {
  return (
    <div class=" flex items-center -space-x-4">
      <FaSolidCloud class="w-14 h-14 text-neutral-700" />
      <BsSearch class="w-7 h-7 text-white translate-y-1" />
    </div>
  );
}

const PLACEHOLDERS = [
  "current occupancy of the loading dock",
  "potential equipment failures in the warehouse",
  "back door access last night",
  "a car parking in spot 42",
  "total number of guests today",
  "unattended packages",
  "delivery truck arriving",
];

export function usePlaceholder(props: { no_animation: boolean }) {
  const [placeholder, setPlaceholder] = createSignal("Search");

  const longestCommonPrefix = (a: string, b: string) => {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) {
      i++;
    }
    return i;
  };

  onMount(async () => {
    if (props.no_animation) return;
    let index = 0;
    while (true) {
      let current = untrack(placeholder);

      const lcpLength = longestCommonPrefix(current, PLACEHOLDERS[index]);
      while (current.length > lcpLength) {
        setPlaceholder(current.slice(0, -1));
        current = untrack(placeholder);
        await new Promise((r) => setTimeout(r, 30));
      }

      while (current.length < PLACEHOLDERS[index].length) {
        setPlaceholder(PLACEHOLDERS[index].slice(0, current.length + 1));
        current = untrack(placeholder);
        await new Promise((r) => setTimeout(r, 50));
      }

      await new Promise((r) => setTimeout(r, 2000));

      index = (index + 1) % PLACEHOLDERS.length;
    }
  });

  return {
    placeholder,
  };
}

export default function SearchBar(props?: { variant?: "md" | "lg" }) {
  const variant = () => props?.variant || "md";
  const { placeholder } = usePlaceholder({
    no_animation: variant() === "md",
  });
  const [isOpen, setIsOpen] = createSignal(false);
  const [barRef, setBarRef] = createSignal<HTMLDivElement>();
  const [state, setState] = createSignal<{
    type: "idle" | "searching" | "result";
    query?: string;
    result?: {
      items: any[];
    };
  }>({
    type: "result",
    result: {
      items: [
        {
          id: "a80fadb8-7456-4122-b2ac-d3b541e9908f",
          description:
            "The image captures a serene harbor scene under a setting sun, with a dock extending into the water. The dock is adorned with several boats, including a white boat, a white and blue boat, and a white and blue boat. The dock is surrounded by a variety of structures, including a building with a tiled roof, a building with a red roof, and a building with a white roof.\n\nIn the foreground, a person is seen standing on the dock, observing the boats. The person is dressed in casual attire, with a black jacket and jeans, and is positioned near the edge of the dock. The dock itself is made of brick, with a red-tiled walkway leading up to it.\n\nThe water around the dock is calm, reflecting the sky above. The overall atmosphere of the scene is tranquil and picturesque, with the dock and boats providing a sense of calm and leisure.",
          at_time: "2025-10-03 23:45:56.688+02",
          path: "/tmp/birdview_frames/a80fadb8-7456-4122-b2ac-d3b541e9908f.jpg",
          stream_id: "camera-6",
          score: 2.0012637482632245,
          "score:1": 2.0012637482632245,
        },
        {
          id: "59d50e5c-9abf-4a7a-97bc-f938a21ece74",
          description:
            "The image captures a serene harbor scene under a setting sun, with a prominent dock extending into the water. The dock is adorned with several boats, including a small white boat, a white and blue boat, and a white and blue boat. The dock is surrounded by a variety of structures, including a building with a gray roof, a white building with a green roof, and a red brick building with a green roof.\n\nIn the foreground, a person is seen standing on the dock, possibly observing the boats or interacting with the dock. The person is wearing a white shirt and is positioned near the edge of the dock, with the boat slightly ahead of them.\n\nThe water around the dock is calm, reflecting the sky above. The overall atmosphere of the image is tranquil and picturesque, with the dock and boats providing a sense of calm and serenity.",
          at_time: "2025-10-03 23:46:49.571+02",
          path: "/tmp/birdview_frames/59d50e5c-9abf-4a7a-97bc-f938a21ece74.jpg",
          stream_id: "camera-6",
          score: 1.998253218756669,
          "score:1": 1.998253218756669,
        },
        {
          id: "9be5c2da-47df-4504-a5ee-d8a1f98a55a2",
          description:
            "The image captures a serene harbor scene under the setting sun, with a variety of boats and docked vessels visible. The water is calm, reflecting the sky above, and the boats are docked in a row, with some closer to the shore and others further out. The docked boats are predominantly white, with some green and blue ones, indicating a mix of colors and styles.\n\nIn the foreground, there is a red brick walkway leading to a wooden dock, which is partially visible. The wooden dock is adorned with a lantern, adding a touch of rustic charm to the scene.\n\nThe sky is a gradient of orange and yellow, suggesting either sunrise or sunset. The overall atmosphere is calm and peaceful, with the boats and docked vessels creating a picturesque setting.",
          at_time: "2025-10-03 23:50:22.568+02",
          path: "/tmp/birdview_frames/9be5c2da-47df-4504-a5ee-d8a1f98a55a2.jpg",
          stream_id: "camera-6",
          score: 1.9433738848105255,
          "score:1": 1.9433738848105255,
        },
        {
          id: "e5f5aa01-172f-4108-913b-5ff267430229",
          description:
            "The image captures a serene harbor scene under a setting sun, with a dock extending into the water. The dock is adorned with several boats, including a white boat, a small white boat, and a white boat with a blue stripe. The dock is surrounded by a variety of structures, including a building with a gray roof, a white building with a red roof, and a red brick building with a white roof.\n\nIn the foreground, a person is seen standing on the dock, possibly observing the boats or interacting with the dock. The sky is a gradient of orange and pink hues, suggesting a warm, sunny day. The overall atmosphere is one of tranquility and leisure, with the dock and boats providing a tranquil backdrop.\n\nThe image is a blend of natural and man-made elements, with the dock and boats as the primary subjects. The person on the dock is positioned in the foreground, while the buildings and structures in the background are in the background. The colors in the image are predominantly blue, white, and red, with the orange and pink hues from the sky adding a warm, inviting contrast.",
          at_time: "2025-10-03 23:46:41.986+02",
          path: "/tmp/birdview_frames/e5f5aa01-172f-4108-913b-5ff267430229.jpg",
          stream_id: "camera-6",
          score: 1.9314273263194166,
          "score:1": 1.9314273263194166,
        },
        {
          id: "95c8c9c8-9c94-4dae-af32-c167dabf690d",
          description:
            "The image captures a serene harbor scene under a setting sun, with a prominent dock extending into the water. The dock is adorned with several boats, including a white boat, a small white boat, and a white boat with a blue stripe. The dock is surrounded by a variety of structures, including a house with a tiled roof, a building with a red brick facade, and a building with a white roof.\n\nIn the foreground, a person is seen walking along the dock, possibly engaged in a task related to the boats or the dock itself. The person is dressed in casual attire, with a white shirt and a blue skirt, suggesting a relaxed and leisurely atmosphere.\n\nThe water around the dock is calm, reflecting the sky above. The overall scene is one of tranquility and leisure, with the dock and the surrounding environment providing a tranquil backdrop. The image is a snapshot of a moment, capturing the essence of a peaceful harbor setting under the warm glow of the setting sun.",
          at_time: "2025-10-03 23:47:00.827+02",
          path: "/tmp/birdview_frames/95c8c9c8-9c94-4dae-af32-c167dabf690d.jpg",
          stream_id: "camera-6",
          score: 1.9189447801222321,
          "score:1": 1.9189447801222321,
        },
        {
          id: "80f272c4-94cd-4e4b-b2c3-20362a543656",
          description:
            "The image depicts a serene harbor scene under a setting sun, with a variety of boats docked and a building with a red brick facade and a green roof visible in the background. The boats are predominantly white, with some blue and green accents, and are docked in a row, with the dock extending into the water. The building has a red brick facade and a green roof, and is situated on the right side of the image.\n\nThere are several people visible in the scene, with some standing near the dock, others near the building, and a few standing near the water. The people appear to be engaged in various activities, such as walking, standing, and interacting with the boats. The overall atmosphere suggests a calm and peaceful day at the harbor.\n\nThe water in the harbor is a deep blue, reflecting the light from the setting sun. The dock is made of wooden planks, and there are several boats docked along the length of the dock, indicating a well-maintained and orderly harbor environment. The overall scene conveys a sense of tranquility and leisure, typical of a day at a harbor.",
          at_time: "2025-10-03 23:47:40.768+02",
          path: "/tmp/birdview_frames/80f272c4-94cd-4e4b-b2c3-20362a543656.jpg",
          stream_id: "camera-6",
          score: 1.9157818578508061,
          "score:1": 1.9157818578508061,
        },
        {
          id: "3065c8f2-eeaa-4e15-b3c9-53c37651b79f",
          description:
            "The image captures a serene harbor scene under a setting sun, with a prominent dock extending into the water. The dock is adorned with several boats, including a white boat, a small white boat, and a white boat with a blue stripe. The dock is surrounded by a variety of structures, including a building with a gray roof, a white building with a green roof, and a red building with a green roof.\n\nIn the foreground, a person is seen standing on a wooden dock, possibly observing the boats or perhaps waiting for their arrival. The person is dressed in a dark-colored shirt and beige pants, with a black hat on their head.\n\nThe water around the dock is calm, reflecting the sky above. The overall atmosphere is tranquil and picturesque, with the dock and boats providing a sense of calm and serenity.",
          at_time: "2025-10-03 23:46:03.514+02",
          path: "/tmp/birdview_frames/3065c8f2-eeaa-4e15-b3c9-53c37651b79f.jpg",
          stream_id: "camera-6",
          score: 1.909844646429341,
          "score:1": 1.909844646429341,
        },
        {
          id: "71e6dc15-7f2f-472f-a63e-63d5ddf5c4d5",
          description:
            'The image captures a serene harbor scene under a setting sun, with a prominent dock extending into the water. The dock is adorned with several boats, including a white boat, a small white boat, and a white boat with a blue stripe. The boats are docked in a row, with the white boat positioned closer to the camera, and the other boats further away.\n\nIn the background, a building with a tiled roof and a sign that reads "HOTEL" is visible, indicating the location of the dock. The sky is a gradient of orange and yellow, suggesting either sunrise or sunset. The overall atmosphere is calm and picturesque, with the boats and dock providing a tranquil backdrop.',
          at_time: "2025-10-03 23:47:23.389+02",
          path: "/tmp/birdview_frames/71e6dc15-7f2f-472f-a63e-63d5ddf5c4d5.jpg",
          stream_id: "camera-6",
          score: 1.905959663379169,
          "score:1": 1.905959663379169,
        },
        {
          id: "38b895ff-92fb-49c1-b711-3305b94922e3",
          description:
            'The image captures a serene harbor scene under a setting sun, with a prominent dock extending into the water. The dock is adorned with several boats, including a white boat, a small white boat, and a white boat with a blue stripe. The boats are docked in a row, with the white boat positioned closer to the camera, and the other boats further away.\n\nIn the background, a building with a tiled roof and a sign that reads "HOTEL" is visible, indicating the location of the dock. The sky is a gradient of orange and yellow, suggesting either sunrise or sunset. The overall atmosphere is calm and picturesque, with the boats and dock providing a tranquil backdrop.',
          at_time: "2025-10-03 23:44:41.722+02",
          path: "/tmp/birdview_frames/38b895ff-92fb-49c1-b711-3305b94922e3.jpg",
          stream_id: "camera-6",
          score: 1.905959663379169,
          "score:1": 1.905959663379169,
        },
        {
          id: "2540e2f8-3997-47a9-a243-fa39f8f701a6",
          description:
            "The image depicts a serene harbor scene under a setting sun, with a prominent building in the background. The building is a multi-story structure with a gray roof, and it is adorned with multiple windows and a balcony. The building is situated on a dock, which is surrounded by a marina with several boats docked. The boats are predominantly white, with some having green or blue accents, indicating their color.\n\nThe marina is filled with a variety of boats, including a white boat, a white and blue boat, and a white and green boat. The boats are docked in a row, with some closer to the dock and others further away. The dock is made of wooden planks, and it is surrounded by a red brick wall.\n\nIn the foreground, there is a lantern on the dock, which is lit, suggesting that the boat is either recently arrived or is ready to be used. The overall atmosphere of the scene is calm and serene, with the boats and the marina providing a tranquil backdrop.",
          at_time: "2025-10-03 23:43:55.084+02",
          path: "/tmp/birdview_frames/2540e2f8-3997-47a9-a243-fa39f8f701a6.jpg",
          stream_id: "camera-6",
          score: 1.891712469521553,
          "score:1": 1.891712469521553,
        },
        {
          id: "47d5c682-5e5c-4877-9ff2-4e539e7ad1bc",
          description:
            "The image depicts a serene harbor scene under a setting sun, with a prominent dock extending into the water. The dock is adorned with several boats, including a small white boat, a white and blue boat, and a white and green boat. The dock is surrounded by a variety of structures, including a building with a gray roof, a white building with a red roof, and a red brick building with a white roof.\n\nIn the foreground, there is a small white boat, possibly a fishing boat, positioned near the dock. The water around the dock is calm, reflecting the sky above. The overall atmosphere suggests a peaceful and leisurely day at the harbor.\n\nThe sky is a gradient of orange and yellow, indicating either sunrise or sunset. The sun is positioned in the upper left corner of the image, casting a warm glow over the scene. The reflection of the sky and the dock in the water adds depth and dimension to the image.\n\nThere are no discernible texts or actions taking place in the image. The relative positions of the objects suggest a harmonious balance between the dock, the boats, and the surrounding environment. The image captures a tranquil moment at a harbor, with the dock serving as a focal point amidst the serene surroundings.",
          at_time: "2025-10-03 23:42:53.174+02",
          path: "/tmp/birdview_frames/47d5c682-5e5c-4877-9ff2-4e539e7ad1bc.jpg",
          stream_id: "camera-6",
          score: 1.8875159526163483,
          "score:1": 1.8875159526163483,
        },
        {
          id: "7ad408e5-e72b-4765-843a-cc3df96d38a7",
          description:
            "The image depicts a serene harbor scene under a sunset sky. The foreground is dominated by a dock with several boats docked, including a white boat with a blue stripe, a white boat with a blue stripe, and a white boat with a blue stripe. The dock is surrounded by a brick walkway, which is lined with a red brick wall.\n\nIn the background, there are several buildings, including a house with a tiled roof and a white building with a red roof. The buildings are situated on the left side of the image, with the house on the right. The sky is a gradient of orange and yellow hues, transitioning to a darker blue at the horizon.\n\nThe water in the harbor is calm, with a few ripples visible. The boats are docked in a row, with the white boat closest to the camera and the white boat further away. The dock is made of wooden planks, and there are several lights on the dock, including a lantern and a street lamp.\n\nThe overall atmosphere of the image is peaceful and serene, with the sunset casting a warm glow over the scene. The boats, docked in a row, add a sense of order and harmony to the scene.",
          at_time: "2025-10-03 23:50:43.8+02",
          path: "/tmp/birdview_frames/7ad408e5-e72b-4765-843a-cc3df96d38a7.jpg",
          stream_id: "camera-6",
          score: 1.8816656166605483,
          "score:1": 1.8816656166605483,
        },
        {
          id: "b1d42743-620a-4702-ae96-938fa1df07eb",
          description:
            "The image captures a serene harbor scene under a setting sun, with a dock extending into the water. The dock is adorned with several boats, including a white boat, a small white boat, and a white boat with a blue stripe. The dock is surrounded by a variety of structures, including a building with a red brick facade, a white building with a green roof, and a white building with a red roof.\n\nIn the foreground, a person is seen walking along the dock, possibly admiring the boats or engaging in a leisurely activity. The water around the dock is calm, reflecting the sky above. The overall atmosphere is one of tranquility and leisure, with the dock and boats providing a tranquil backdrop.\n\nThe image is taken from a high vantage point, providing a comprehensive view of the harbor and its surroundings. The perspective is from a distance, allowing for a comprehensive view of the scene. The image is a snapshot of a moment, capturing the essence of a peaceful harbor day.",
          at_time: "2025-10-03 23:46:26.584+02",
          path: "/tmp/birdview_frames/b1d42743-620a-4702-ae96-938fa1df07eb.jpg",
          stream_id: "camera-6",
          score: 1.8668982516719383,
          "score:1": 1.8668982516719383,
        },
        {
          id: "4c4cae69-daa9-4e7f-9266-08d84983cbfc",
          description:
            "The image captures a serene harbor scene under a setting sun, with a row of boats docked at a pier. The boats are predominantly white, with some green and blue ones, indicating a mix of colors. The pier is adorned with a red brick walkway, providing a contrast to the dark water.\n\nIn the foreground, a wooden dock extends from the pier, with a few people visible, possibly dockworkers or visitors. The dock is equipped with a few ropes and a few lanterns, suggesting a warm and inviting atmosphere.\n\nThe sky is a gradient of orange and yellow, indicating either sunrise or sunset. The overall scene is tranquil and picturesque, with the boats and dock providing a sense of calm and tranquility.\n\nThe image is a blend of natural and man-made elements, with the boats and dock providing a sense of depth and perspective. The warm hues of the sky and the orange and yellow tones of the dock and sky create a harmonious balance, enhancing the overall aesthetic of the scene.",
          at_time: "2025-10-03 23:48:34.086+02",
          path: "/tmp/birdview_frames/4c4cae69-daa9-4e7f-9266-08d84983cbfc.jpg",
          stream_id: "camera-6",
          score: 1.8599275987599444,
          "score:1": 1.8599275987599444,
        },
        {
          id: "976c56fa-fdeb-4ea5-b66c-b520068c771f",
          description:
            "The image depicts a serene harbor scene under a partly cloudy sky. The foreground is dominated by a dock extending into the water, where several boats are docked. The boats are predominantly white, with some having green or blue accents, indicating their color. The dock is surrounded by a variety of structures, including a building with a red brick facade and a white structure with a green roof, both of which are visible in the image.\n\nIn the background, there is a building with a gray roof, which is partially obscured by the dock. The building is surrounded by a variety of structures, including a white structure with a green roof, a red structure with a green roof, and a white structure with a green roof. The water in the harbor is calm, with a few boats visible in the distance, suggesting a peaceful and calm environment.\n\nThe overall atmosphere of the image is one of tranquility and leisure, with the dock and boats providing a sense of calm and relaxation. The image captures a moment of calm and leisure, with the dock and boats providing a sense of connection to nature and the sea.",
          at_time: "2025-10-03 23:43:23.815+02",
          path: "/tmp/birdview_frames/976c56fa-fdeb-4ea5-b66c-b520068c771f.jpg",
          stream_id: "camera-6",
          score: 1.839324505831033,
          "score:1": 1.839324505831033,
        },
        {
          id: "2d226f24-f1ed-4483-9311-10816f193896",
          description:
            "The image depicts a serene harbor scene under a sunset sky. The foreground is dominated by a dock with several boats docked, including a white boat with a blue stripe, a white boat with a blue stripe, and a white boat with a blue stripe. The dock is surrounded by a brick walkway, and there are several people visible, including a person standing on the dock, a person standing on the walkway, and a person standing on the dock.\n\nIn the background, there are several buildings with a mix of architectural styles, including a modern building with a gray roof and a traditional building with a red roof. The buildings are situated on the left side of the image, with the modern building on the right.\n\nThe water in the harbor is calm, reflecting the sky above. The overall atmosphere is calm and serene, with the boats and people enjoying their time at the harbor.",
          at_time: "2025-10-03 23:50:28.69+02",
          path: "/tmp/birdview_frames/2d226f24-f1ed-4483-9311-10816f193896.jpg",
          stream_id: "camera-6",
          score: 1.8384308665216473,
          "score:1": 1.8384308665216473,
        },
        {
          id: "66569f9c-2533-4731-9edd-f5283e617992",
          description:
            "The image captures a serene harbor scene under the twilight sky, with a prominent dock extending into the water. The dock is adorned with several boats, including a small white boat, a white and silver boat, and a white and silver boat. The dock is surrounded by a variety of structures, including a building with a red brick facade, a white building with a gray roof, and a white building with a green roof.\n\nIn the background, a building with a gray roof and a white roof is visible, and a building with a green roof is also present. The water is calm, reflecting the sky's hues of blue and orange. The overall atmosphere is one of tranquility and calm, with the boats and dock providing a tranquil backdrop.\n\nThe image is taken from a high vantage point, providing a comprehensive view of the harbor and its surroundings. The perspective is from the water, allowing for a comprehensive view of the dock and the surrounding area. The image is a beautiful representation of a peaceful harbor scene, with the boats and dock providing a serene backdrop.",
          at_time: "2025-10-03 23:46:34.676+02",
          path: "/tmp/birdview_frames/66569f9c-2533-4731-9edd-f5283e617992.jpg",
          stream_id: "camera-6",
          score: 1.8359349528836568,
          "score:1": 1.8359349528836568,
        },
        {
          id: "2f5d7d11-e5fc-482d-a93c-8710a5604cee",
          description:
            "The image depicts a serene harbor scene under a partly cloudy sky. The foreground is dominated by a dock extending into the water, where several boats are docked. The boats are predominantly white, with some having a blue or green color scheme. The dock is surrounded by a variety of structures, including a building with a red brick facade and a white structure with a green roof.\n\nIn the background, there are several other boats docked, including a white boat with a blue stripe, a white boat with a green stripe, and a white boat with a blue stripe. The water is calm, reflecting the sky's light and creating a picturesque setting.\n\nThe overall atmosphere of the image is calm and serene, with the boats and dock providing a tranquil backdrop. The image captures a moment of calm and tranquility, likely captured during a peaceful day at the harbor.",
          at_time: "2025-10-03 23:43:48.642+02",
          path: "/tmp/birdview_frames/2f5d7d11-e5fc-482d-a93c-8710a5604cee.jpg",
          stream_id: "camera-6",
          score: 1.8303247382932848,
          "score:1": 1.8303247382932848,
        },
        {
          id: "083b94d9-6ce5-4cf9-bb70-14176653bb04",
          description:
            "The image depicts a serene harbor scene under a setting sun, with a dock extending into the water. The dock is adorned with several boats, including a white boat, a small white boat, and a white boat with a blue stripe. The boats are docked in a row, with the white boat positioned closer to the camera, and the white boat positioned further away.\n\nIn the background, there is a building with a gray roof, which appears to be a dockside structure. The building is surrounded by a variety of structures, including a small structure with a red roof, a white structure with a red roof, and a structure with a red roof. The dock is also adorned with several people, some standing and others walking along the dock.\n\nThe water in the harbor is calm, with a few ripples visible, indicating recent movement. The overall atmosphere suggests a peaceful and leisurely day at the harbor.",
          at_time: "2025-10-03 23:44:53.549+02",
          path: "/tmp/birdview_frames/083b94d9-6ce5-4cf9-bb70-14176653bb04.jpg",
          stream_id: "camera-6",
          score: 1.8303247382932848,
          "score:1": 1.8303247382932848,
        },
        {
          id: "4e0b4e93-718b-488e-a5a9-fdc073a550bd",
          description:
            "The image captures a serene harbor scene under a setting sun, with a prominent dock extending into the water. The dock is adorned with several boats, including a white boat, a small white boat, and a white boat with a blue stripe. The dock is surrounded by a variety of structures, including a building with a tiled roof, a building with a red brick facade, and a building with a white roof.\n\nIn the foreground, a red brick walkway leads to the dock, where a lantern stands, possibly indicating the presence of a lantern or a lantern-lit lantern. The water is calm, reflecting the sky above, and the overall scene is tranquil and picturesque.\n\nThe sky is a gradient of orange and yellow, suggesting either sunrise or sunset. The overall atmosphere is one of calm and serenity, with the dock and the boats providing a sense of seclusion and tranquility.",
          at_time: "2025-10-03 23:45:44.878+02",
          path: "/tmp/birdview_frames/4e0b4e93-718b-488e-a5a9-fdc073a550bd.jpg",
          stream_id: "camera-6",
          score: 1.8303247382932848,
          "score:1": 1.8303247382932848,
        },
        {
          id: "3060de38-f96f-451f-b11a-391fee6a0878",
          description:
            "The image captures a serene harbor scene under a setting sun, with a prominent dock extending into the water. The dock is adorned with several boats, including a white boat, a small white boat, and a white boat with a blue stripe. The boats are docked in a row, with the white boat positioned closer to the camera, and the other boats further away.\n\nIn the background, a building with a gray roof and a white facade is visible, adding to the nautical ambiance. The sky is a gradient of orange and yellow, suggesting either sunrise or sunset. The overall scene is tranquil and picturesque, with the boats and dock providing a picturesque backdrop.",
          at_time: "2025-10-03 23:44:14.478+02",
          path: "/tmp/birdview_frames/3060de38-f96f-451f-b11a-391fee6a0878.jpg",
          stream_id: "camera-6",
          score: 1.8269852273656102,
          "score:1": 1.8269852273656102,
        },
        {
          id: "7824dac0-88c2-4630-9f40-83adc23d4046",
          description:
            "The image captures a serene harbor scene under a setting sun, with a dock extending into the water. The dock is adorned with several boats, including a white boat, a small white boat, and a white boat with a blue stripe. The boats are docked in a row, with the white boat positioned closer to the camera, and the white boat positioned further away.\n\nIn the background, a building with a gray roof and a white structure with green accents is visible. The building appears to be a small, one-story structure with a small balcony or porch, and it is partially obscured by the dock.\n\nThe water is calm, with gentle ripples indicating the gentle movement of the water. The sky is a gradient of orange and yellow, suggesting either sunrise or sunset. The overall atmosphere is tranquil and picturesque, with the dock and boats providing a sense of calm and serenity.",
          at_time: "2025-10-03 23:45:51.019+02",
          path: "/tmp/birdview_frames/7824dac0-88c2-4630-9f40-83adc23d4046.jpg",
          stream_id: "camera-6",
          score: 1.8262984217589993,
          "score:1": 1.8262984217589993,
        },
        {
          id: "cdd693f6-ca50-496c-8525-74044a2ff05b",
          description:
            "The image depicts a serene harbor scene under a setting sun, with a prominent dock extending into the water. The dock is surrounded by several boats, including a small white boat, a white and blue boat, and a white and blue boat. The dock is equipped with a few ropes and a few lights, indicating that it is a well-maintained and functional dock.\n\nIn the background, there are several buildings, including a house with a tiled roof and a smaller structure with a red brick facade. The buildings are situated on the left side of the image, with the dock extending into the water. The water is calm, reflecting the sky above, and the overall scene suggests a peaceful and leisurely atmosphere.\n\nThe sky is a gradient of orange and yellow, indicating either sunrise or sunset, with the sun positioned in the upper right corner of the image. The overall lighting is soft and natural, suggesting a calm and serene day.\n\nThere are no discernible texts or actions in the image, and the relative positions of the objects and their relative positions to each other are consistent with a typical day at a harbor. The image captures a moment of tranquility and leisure, with the dock and boats as the focal points.",
          at_time: "2025-10-03 23:42:36.6+02",
          path: "/tmp/birdview_frames/cdd693f6-ca50-496c-8525-74044a2ff05b.jpg",
          stream_id: "camera-6",
          score: 1.8158571129708887,
          "score:1": 1.8158571129708887,
        },
        {
          id: "401441cd-5b7c-46ad-b1b3-5d13af822f1c",
          description:
            "The image depicts a serene harbor scene under a setting sun, with a variety of boats docked and moored along the water's edge. The boats are predominantly white, with some having green or blue accents, and are positioned in a row, with the closest boat being a small white boat. The water is calm, reflecting the sky's light and creating a picturesque backdrop.\n\nIn the foreground, there is a red brick walkway leading to a dock, which is sheltered by a wooden railing. The dock is equipped with a few lanterns, adding to the nautical ambiance. The overall scene suggests a tranquil and picturesque harbor setting, with the boats and dock providing a sense of calm and serenity.",
          at_time: "2025-10-03 23:47:35.004+02",
          path: "/tmp/birdview_frames/401441cd-5b7c-46ad-b1b3-5d13af822f1c.jpg",
          stream_id: "camera-6",
          score: 1.8120318206916213,
          "score:1": 1.8120318206916213,
        },
        {
          id: "baf52f75-51ed-4078-a96a-c9423a5f08e0",
          description:
            "The image depicts a serene harbor scene under a partly cloudy sky. The foreground is dominated by a dock extending into the water, where several boats are docked. The boats are predominantly white, with some having green accents, indicating they might be fishing or recreational vessels. The dock is surrounded by a variety of structures, including a building with a tiled roof, a structure with a red brick facade, and a structure with a wooden deck.\n\nIn the background, there are several other boats docked, including a white boat with a blue stripe, a white boat with a blue stripe, and a white boat with a blue stripe. The water is calm, with a few ripples visible, suggesting recent or ongoing activity.\n\nThe overall atmosphere of the image is calm and peaceful, with the boats and dock providing a tranquil backdrop. The sky is partly cloudy, indicating a partly cloudy day, and the overall lighting suggests it is either early morning or late afternoon.\n\nThe image does not contain any discernible text. The relative positions of the objects suggest a well-organized and orderly harbor environment. The boats and dock are positioned in a way that suggests they are ready for use, with the white boat in the foreground and the other boats in the background. The overall",
          at_time: "2025-10-03 23:43:01.66+02",
          path: "/tmp/birdview_frames/baf52f75-51ed-4078-a96a-c9423a5f08e0.jpg",
          stream_id: "camera-6",
          score: 1.7994580071904023,
          "score:1": 1.7994580071904023,
        },
        {
          id: "85120fed-a465-474e-941a-6119cb3c81e4",
          description:
            "The image captures a serene harbor scene under a setting sun, with a prominent dock extending into the water. The dock is adorned with several boats, including a white boat, a small white boat, and a white boat with a blue stripe. The boats are docked in a row, with the white boat positioned closer to the camera, and the white boat further away, closer to the water's edge.\n\nIn the background, a building with a tiled roof and a white roof structure is visible, adding to the nautical ambiance. The sky is a gradient of orange and yellow hues, suggesting either sunrise or sunset. The overall scene is tranquil and picturesque, with the boats and dock providing a picturesque backdrop.",
          at_time: "2025-10-03 23:47:05.935+02",
          path: "/tmp/birdview_frames/85120fed-a465-474e-941a-6119cb3c81e4.jpg",
          stream_id: "camera-6",
          score: 1.7973212064397308,
          "score:1": 1.7973212064397308,
        },
        {
          id: "2bf15f85-2415-44ba-9ae2-f72032248ea4",
          description:
            "The image captures a serene harbor scene under a setting sun, with a prominent building in the background. The building is a multi-story structure with a gray roof, and it is adorned with green and white accents. The building's windows are open, revealing a glimpse of the surrounding water.\n\nIn the foreground, there is a dock extending into the water, with a white boat positioned near the dock. The dock is surrounded by a series of wooden structures, including a red brick structure, which appears to be a part of the dock's structure.\n\nThe water is calm, reflecting the sky above, and the overall scene is tranquil and picturesque. The image is taken from a high vantage point, providing a comprehensive view of the harbor and its surroundings.",
          at_time: "2025-10-03 23:44:08.709+02",
          path: "/tmp/birdview_frames/2bf15f85-2415-44ba-9ae2-f72032248ea4.jpg",
          stream_id: "camera-6",
          score: 1.7973212064397308,
          "score:1": 1.7973212064397308,
        },
        {
          id: "33323dc3-7bf7-4628-a80b-80b24156f042",
          description:
            'The image captures a serene harbor scene under a setting sun, with a prominent dock extending into the water. The dock is adorned with several boats, including a white boat, a small white boat, and a white boat with a blue stripe. The boats are docked in a row, with the white boat positioned closer to the camera, and the white boat positioned further away, closer to the water\'s edge.\n\nIn the background, a building with a tiled roof and a sign that reads "HOTEL" is visible, indicating the presence of a hotel or resort. The sky is a gradient of orange and yellow, suggesting either sunrise or sunset. The overall atmosphere is calm and inviting, with the boats and dock providing a tranquil backdrop.',
          at_time: "2025-10-03 23:47:29.809+02",
          path: "/tmp/birdview_frames/33323dc3-7bf7-4628-a80b-80b24156f042.jpg",
          stream_id: "camera-6",
          score: 1.7924706029538524,
          "score:1": 1.7924706029538524,
        },
        {
          id: "63028bd3-4e5a-4d42-b5d7-1ed3567d65bb",
          description:
            "The image captures a serene harbor scene under a setting sun, with a variety of boats and structures visible. The water is calm, reflecting the sky's hues of orange and pink. The boats are docked at a pier, with a few boats docked closer to the shore and others further away. \n\nIn the foreground, a wooden dock extends from the pier, with a few boats docked nearby. The dock is adorned with a few lanterns, adding a warm glow to the scene. The sky is a gradient of orange and pink, with a few clouds scattered across it.\n\nThe buildings in the background are constructed from brick and have a rustic charm, with a few windows visible. The buildings are spaced out, creating a sense of depth and space.\n\nThe image is taken from a high vantage point, looking down at the harbor, which is a deep blue-green color. The perspective is from a boat, providing a clear view of the harbor and its surroundings.\n\nThe image is a beautiful representation of a tranquil harbor scene, with its blend of natural and man-made elements.",
          at_time: "2025-10-03 23:48:26.614+02",
          path: "/tmp/birdview_frames/63028bd3-4e5a-4d42-b5d7-1ed3567d65bb.jpg",
          stream_id: "camera-6",
          score: 1.790843229577869,
          "score:1": 1.790843229577869,
        },
        {
          id: "e7d47c85-a695-4bf3-991c-dc088c3d1efa",
          description:
            "The image captures a serene harbor scene under a setting sun, with a prominent dock extending into the water. The dock is adorned with several boats, including a white boat, a small white boat, and a white boat with a blue stripe. The boats are docked in a row, with the white boat positioned closer to the camera, and the white boat positioned further away, closer to the water's edge.\n\nIn the background, a building with a gray roof and a white facade is visible, adding to the nautical ambiance. The sky is a gradient of orange and yellow, suggesting either sunrise or sunset. The overall scene is tranquil, with the boats and dock providing a tranquil backdrop.\n\nThe image is taken from a high vantage point, providing a comprehensive view of the harbor and its surroundings. The perspective is from a boat, allowing for a comprehensive view of the dock and the surrounding water. The image is a beautiful representation of a serene harbor scene under the warm glow of the setting sun.",
          at_time: "2025-10-03 23:44:47.367+02",
          path: "/tmp/birdview_frames/e7d47c85-a695-4bf3-991c-dc088c3d1efa.jpg",
          stream_id: "camera-6",
          score: 1.7831504449739974,
          "score:1": 1.7831504449739974,
        },
        {
          id: "7c27984d-b4c1-416a-9add-9174230a0217",
          description:
            'The image captures a serene harbor scene under a setting sun, with a prominent dock extending into the water. The dock is adorned with several boats, including a white boat, a small white boat, and a white boat with a blue stripe. The boats are docked in a row, with the white boat positioned closer to the camera, and the other boats further away.\n\nIn the background, a building with a tiled roof and a sign that reads "HOTEL" is visible, indicating the presence of a hotel or resort. The sky is a gradient of orange and yellow, suggesting either sunrise or sunset. The overall atmosphere is calm and inviting, with the boats and dock providing a tranquil backdrop.\n\nThere are no discernible texts or actions in the image, and the relative positions of the objects suggest a well-organized and orderly scene. The relative positions of the objects, such as the dock and the boats, indicate a well-planned and orderly layout. The image does not provide any specific information about the location or the time of day, but it is clear that the scene is peaceful and well-maintained.',
          at_time: "2025-10-03 23:45:37.752+02",
          path: "/tmp/birdview_frames/7c27984d-b4c1-416a-9add-9174230a0217.jpg",
          stream_id: "camera-6",
          score: 1.7793287835228342,
          "score:1": 1.7793287835228342,
        },
        {
          id: "5ff11bf0-7d14-4a57-9bc6-9fa1842499c3",
          description:
            "The image depicts a serene harbor scene under a sunset sky. The foreground is dominated by a dock with several boats docked, including a white boat with a blue stripe, a white boat with a blue stripe, and a white boat with a blue stripe. The dock is surrounded by a brick walkway, which is partially visible.\n\nIn the background, there are several buildings with a mix of architectural styles, including a modern building with a gray roof and a traditional building with a red roof. The buildings are situated on the left side of the image, while the dock is on the right.\n\nThe water in the harbor is calm, reflecting the sky's hues. The overall scene suggests a peaceful and leisurely atmosphere, possibly a day at a harbor or a tranquil beachside location.",
          at_time: "2025-10-03 23:50:33.825+02",
          path: "/tmp/birdview_frames/5ff11bf0-7d14-4a57-9bc6-9fa1842499c3.jpg",
          stream_id: "camera-6",
          score: 1.7780746203315532,
          "score:1": 1.7780746203315532,
        },
        {
          id: "dfe4cfeb-b178-4821-b13f-f809e457a012",
          description:
            "The image depicts a serene harbor scene under a partly cloudy sky. The foreground is dominated by a dock extending into the water, where several boats are docked. The boats are predominantly white, with some having green accents, indicating they might be fishing or recreational vessels. The dock is surrounded by a variety of structures, including a building with a red brick facade, a white structure with a green roof, and a structure with a red roof.\n\nIn the background, there is a building with a gray roof, which appears to be a commercial or residential building. The building is surrounded by a fence, and there are several people visible in the scene, possibly engaged in activities such as fishing or observing the harbor.\n\nThe water in the harbor is calm, with a few ripples visible, suggesting recent or ongoing activity. The overall atmosphere is calm and serene, with the boats and dock providing a tranquil backdrop.\n\nThe image is taken from a high vantage point, providing a comprehensive view of the harbor and its surroundings. The perspective is from a dock, which is elevated above the water, offering a clear view of the harbor and its surroundings.\n\nThe image does not contain any discernible text or countable objects. The relative positions of the objects suggest a well",
          at_time: "2025-10-03 23:43:08.412+02",
          path: "/tmp/birdview_frames/dfe4cfeb-b178-4821-b13f-f809e457a012.jpg",
          stream_id: "camera-6",
          score: 1.7274954461773804,
          "score:1": 1.7274954461773804,
        },
        {
          id: "ad02f953-46b3-46c5-9ef6-59b4b9fc0b32",
          description:
            "The image captures a serene harbor scene under a setting sun, with a prominent building in the background. The building is a multi-story structure with a gray roof, and it is adorned with numerous windows and a chimney. The building's facade is adorned with a variety of architectural elements, including a clock tower and a flagpole.\n\nIn the foreground, a wooden dock extends into the water, where several boats are docked. The boats are predominantly white, with some having green or blue accents, indicating their color. The dock is surrounded by a variety of structures, including a few structures with green roofs, suggesting a mix of residential and commercial use.\n\nThe water in the harbor is calm, with a few ripples visible, indicating recent movement or slight changes in the water's surface. The overall scene is tranquil and picturesque, with the building and dock providing a sense of calm and order amidst the natural beauty of the harbor.",
          at_time: "2025-10-03 23:43:35.984+02",
          path: "/tmp/birdview_frames/ad02f953-46b3-46c5-9ef6-59b4b9fc0b32.jpg",
          stream_id: "camera-6",
          score: 1.7182742529529222,
          "score:1": 1.7182742529529222,
        },
        {
          id: "97527ac4-fd7a-419c-8566-a69dcfc497e1",
          description:
            "The image captures a serene harbor scene under a setting sun, with a boat docked at the water's edge. The dock is surrounded by several boats, some of which are docked, while others are either empty or have been recently moored. The water is calm, reflecting the sky above, and the sky itself is a gradient of orange and blue hues, suggesting a warm, sunny day.\n\nIn the foreground, a person is seen standing on the dock, possibly observing the boats or waiting for their arrival. The person is dressed in casual attire, with a casual, relaxed demeanor.\n\nThe buildings in the background are constructed from brick and have a mix of architectural styles, with some featuring large windows and others smaller. The buildings are well-maintained, with a mix of green and white roofs, indicating a well-maintained property.\n\nThe overall scene is one of tranquility and leisure, with the boats and people enjoying their time together. The image is a snapshot of a peaceful day at a harbor, where people are enjoying their time and the natural beauty of the surroundings.",
          at_time: "2025-10-03 23:46:55.018+02",
          path: "/tmp/birdview_frames/97527ac4-fd7a-419c-8566-a69dcfc497e1.jpg",
          stream_id: "camera-6",
          score: 1.7006750961710162,
          "score:1": 1.7006750961710162,
        },
        {
          id: "e337f38e-3540-4f83-83aa-371e7a11663d",
          description:
            "The image depicts a serene harbor scene under a setting sun, with a prominent building in the background. The building is a multi-story structure with a gray roof, and it is adorned with multiple windows and a balcony. The building is situated on a dock, which is surrounded by a marina with several boats docked. The boats are predominantly white, with some having green or blue accents, indicating their color.\n\nIn the foreground, there is a person standing on a wooden dock, possibly observing the scene or engaging in some activity. The person is dressed in casual attire, with a casual, relaxed posture. The dock is bordered by a brick walkway, which is lined with a few lampposts, providing a clear view of the water and the surrounding area.\n\nThe overall atmosphere of the scene is calm and serene, with the sun casting a warm glow over the water and the buildings. The image captures a moment of tranquility and leisure, highlighting the peaceful coexistence of human activity and natural elements in a harbor setting.",
          at_time: "2025-10-03 23:45:30.146+02",
          path: "/tmp/birdview_frames/e337f38e-3540-4f83-83aa-371e7a11663d.jpg",
          stream_id: "camera-6",
          score: 1.6877105118578837,
          "score:1": 1.6877105118578837,
        },
        {
          id: "aad61ada-eab4-4e32-9d1c-2504ca0ecbd8",
          description:
            "The image depicts a serene harbor scene under a setting sun, with a prominent dock extending into the water. The dock is adorned with several boats, including a white boat, a small white boat, and a white boat with a red stripe. The boats are docked in a row, with the white boat positioned closer to the camera, and the white boat positioned further away, closer to the water.\n\nIn the background, there are several buildings, including a house with a tiled roof and a smaller structure with a red roof, suggesting a residential or commercial area. The buildings are situated on the left side of the image, with the house on the right.\n\nThe water is calm, with a few ripples visible on the surface, indicating recent or ongoing wind. The overall atmosphere suggests a peaceful and tranquil setting, possibly a day at the harbor.\n\nThe image is taken from a high vantage point, providing a comprehensive view of the harbor and its surroundings. The perspective is from a boat, which is positioned in the foreground, and the boat is positioned in the center of the image, with the dock extending into the water.\n\nThe image does not contain any discernible text or countable objects. The relative positions of the objects suggest a well-",
          at_time: "2025-10-03 23:44:01.335+02",
          path: "/tmp/birdview_frames/aad61ada-eab4-4e32-9d1c-2504ca0ecbd8.jpg",
          stream_id: "camera-6",
          score: 1.6257436758509192,
          "score:1": 1.6257436758509192,
        },
        {
          id: "aae691b0-dd50-4c30-8aff-f336edc53792",
          description:
            "The image captures a serene harbor scene under a setting sun, with a row of boats docked at a pier. The boats are predominantly white, with some green and blue ones, indicating a mix of colors. The dock is made of wooden planks, and there are several people visible, including a man in a blue shirt and a woman in a red shirt, walking along the pier.\n\nIn the foreground, a man in a blue shirt is seen walking along the pier, while another man in a red shirt is standing nearby, possibly observing the scene. The water is calm, reflecting the sky's hues of orange and pink.\n\nThe harbor itself is a vibrant shade of blue, with the boats and dock visible in the background. The sky is a gradient of orange and pink, suggesting a warm, sunny day. The overall atmosphere is calm and serene, with the boats and people enjoying their time at the harbor.",
          at_time: "2025-10-03 23:47:14.661+02",
          path: "/tmp/birdview_frames/aae691b0-dd50-4c30-8aff-f336edc53792.jpg",
          stream_id: "camera-6",
          score: 1.5890306878946725,
          "score:1": 1.5890306878946725,
        },
        {
          id: "1d731887-2cb1-4e42-bcf6-682f4d1377f7",
          description:
            "The image depicts a serene harbor scene under a setting sun, with a variety of boats and structures visible. The water is calm, reflecting the sky's hues of orange and pink. The boats are docked, with some closer to the shore and others further out, indicating a well-maintained and orderly environment.\n\nIn the foreground, there is a wooden dock with a few people visible, likely dockworkers or visitors. The dock is equipped with a few ropes and a few lanterns, suggesting a relaxed and leisurely atmosphere.\n\nThe sky is a gradient of orange and pink, with a few clouds scattered across it. The overall scene conveys a peaceful and inviting atmosphere, typical of a harbor setting.\n\nThe image is taken from a high vantage point, providing a comprehensive view of the harbor and its surroundings. This perspective allows for a detailed observation of the boats, their positions, and the surrounding environment.\n\nThe image is a snapshot of a day at a harbor, capturing the tranquility and charm of a peaceful harbor environment.",
          at_time: "2025-10-03 23:50:49.44+02",
          path: "/tmp/birdview_frames/1d731887-2cb1-4e42-bcf6-682f4d1377f7.jpg",
          stream_id: "camera-6",
          score: 1.5789569801185772,
          "score:1": 1.5789569801185772,
        },
        {
          id: "a4ed3014-06eb-4a16-a7fa-529007f65daf",
          description:
            "The image depicts a serene harbor scene under a setting sun, with a variety of boats docked and a building with a red brick facade and a white roof visible in the background. The boats are predominantly white, with some blue and green accents, and are docked in a row, with the building's structure and the red brick facade providing a contrast to the natural surroundings. The sky is a gradient of orange and yellow, suggesting either sunrise or sunset.\n\nIn the foreground, there is a small, white boat with a blue stripe, positioned near the dock. The boat is relatively close to the camera, and its position suggests it is the main focus of the image.\n\nThe image is taken from a high angle, providing a comprehensive view of the harbor and its surroundings. The perspective is from a boat, which is positioned in the center of the frame, giving a sense of scale and depth.\n\nThe image is well-composed, with the boats and building in the background providing a natural backdrop. The colors are vibrant, with the blues of the sky and the greens of the trees standing out against the muted tones of the water. The overall composition of the image is balanced, with the boats and building in the foreground providing a clear focal point",
          at_time: "2025-10-03 23:47:58.309+02",
          path: "/tmp/birdview_frames/a4ed3014-06eb-4a16-a7fa-529007f65daf.jpg",
          stream_id: "camera-6",
          score: 1.4760265209958725,
          "score:1": 1.4760265209958725,
        },
        {
          id: "5790593b-c24e-4dad-b387-1fe8cb3d9692",
          description:
            "The image depicts a serene harbor scene under a setting sun, with a variety of boats and structures visible. The water is calm, reflecting the sky's hues of orange and pink. The boats are docked at a pier, with a few boats docked closer to the shore and others further away. \n\nThere are several buildings and structures in the scene, including a house with a tiled roof, a building with a red brick facade, and a structure with a green roof. The buildings are arranged in a row, with some closer to the water and others further out. \n\nThe sky is clear, with a few clouds scattered across it, suggesting a pleasant day. The overall atmosphere is calm and peaceful, with the boats and structures providing a tranquil backdrop. \n\nThe image is taken from a high vantage point, looking down at the harbor, which is a large body of water. The perspective is from a boat, providing a clear view of the harbor and its surroundings. \n\nThe image is a beautiful representation of a tranquil harbor scene, with the boats and structures providing a sense of calm and serenity.",
          at_time: "2025-10-03 23:48:06.33+02",
          path: "/tmp/birdview_frames/5790593b-c24e-4dad-b387-1fe8cb3d9692.jpg",
          stream_id: "camera-6",
          score: 1.3314051377060008,
          "score:1": 1.3314051377060008,
        },
        {
          id: "2e3bf1ee-983e-45a6-8cb6-233ffc7acda3",
          description:
            "The image depicts a nighttime scene at a body of water, likely a lake or a river, illuminated by a single light source. The light source is positioned towards the left side of the frame, casting a soft glow on the water's surface. The water is calm, with no visible waves or ripples, suggesting it might be a calm night.\n\nIn the foreground, there is a structure or structure that appears to be a dock or pier, with a few lights visible on the structure, possibly indicating that it is a boat or a small boat. The structure is relatively small, with a few lights on it, suggesting it might be a small, possibly small-sized boat.\n\nThe background is dark, with no visible details or objects, indicating that the scene is likely taken at night. The overall composition of the image suggests a peaceful, undisturbed setting, possibly a lakeside or a waterfront area.\n\nThe image does not contain any discernible text or additional objects. The relative positions of the objects suggest that the light source is centrally located, with the dock or pier in the foreground and the water in the background. The overall composition of the image is a blend of natural light and artificial lighting, with the dark water and light-filled sky providing a",
          at_time: "2025-10-03 23:45:46.929+02",
          path: "/tmp/birdview_frames/2e3bf1ee-983e-45a6-8cb6-233ffc7acda3.jpg",
          stream_id: "camera-3",
          score: 1.2464513930113323,
          "score:1": 1.2464513930113323,
        },
        {
          id: "fa921c07-7307-4c5c-bd59-041d971995f8",
          description:
            "The image depicts a serene harbor scene under a setting sun, with a variety of boats and structures visible. The boats are docked at a pier, with a few boats docked in the foreground and others in the background. The pier is surrounded by a variety of structures, including a building with a tiled roof, a building with a green roof, and a structure with a red brick facade.\n\nIn the foreground, there is a boat with a white hull and a red stripe, positioned near the water's edge. Another boat with a white hull and a green stripe is positioned further back, closer to the water's edge. A boat with a white hull and a green stripe is also visible, positioned near the water's edge.\n\nThe background features a building with a tiled roof, a building with a green roof, and a structure with a red brick facade. The building with a tiled roof is situated near the water's edge, while the building with a green roof is positioned further back. The structure with a red brick facade is located near the water's edge, and the structure with a green roof is positioned further back.\n\nThe sky is a gradient of orange and yellow, transitioning from the upper left to the lower right, indicating either",
          at_time: "2025-10-03 23:47:47.556+02",
          path: "/tmp/birdview_frames/fa921c07-7307-4c5c-bd59-041d971995f8.jpg",
          stream_id: "camera-6",
          score: 1.2371642796862223,
          "score:1": 1.2371642796862223,
        },
        {
          id: "4d921fcc-29a0-4422-9447-aa861321abf0",
          description:
            "The image depicts a nighttime scene at a harbor, where numerous boats are docked and illuminated by streetlights. The boats are predominantly dark, with some illuminated by streetlights, creating a stark contrast against the dark backdrop. The water is calm, reflecting the lights of the boats and the surrounding structures. The perspective of the image is from the water's edge, looking towards the harbor, which is partially obscured by the boats.\n\nThe boats are of various sizes and shapes, with some being small and others larger, indicating the variety of vessels in the harbor. The boats are predominantly dark, with some illuminated by streetlights, which are visible in the foreground. The lighting is harsh, with the dark water reflecting the light from the boats and streetlights, creating a dramatic effect.\n\nThe harbor is bustling with activity, with several boats docked and illuminated, indicating that the harbor is active and bustling. The overall atmosphere suggests a lively and bustling harbor, possibly during the day.\n\nThe image does not contain any discernible text or additional objects. The relative positions of the objects suggest a typical nighttime scene at a harbor, with the boats and streetlights providing a stark contrast to the dark water. The image captures a moment of calm and activity in a harbor,",
          at_time: "2025-10-03 23:48:34.74+02",
          path: "/tmp/birdview_frames/4d921fcc-29a0-4422-9447-aa861321abf0.jpg",
          stream_id: "camera-5",
          score: 1.2371642796862223,
          "score:1": 1.2371642796862223,
        },
        {
          id: "96f4f51f-3841-47fb-b6f8-ae4a4ce227b4",
          description:
            'The image captures a serene harbor scene under a setting sun, with a prominent building in the background. The building is a multi-story structure with a gray roof, and it is adorned with numerous windows and a chimney. The building is surrounded by a marina, with several boats docked in the water, including a white boat with the word "Boat" visible on its side. The marina is enclosed by a brick wall, and there are several people visible, some standing and others seated, engaged in various activities.\n\nThe water in the marina is calm, reflecting the sky above. The overall atmosphere is tranquil and picturesque, with the building and boats providing a picturesque backdrop to the serene harbor.',
          at_time: "2025-10-03 23:43:42.495+02",
          path: "/tmp/birdview_frames/96f4f51f-3841-47fb-b6f8-ae4a4ce227b4.jpg",
          stream_id: "camera-6",
          score: 1.1042241479962311,
          "score:1": 1.1042241479962311,
        },
        {
          id: "6d7873d8-17d6-4886-b5e4-5b81793ed026",
          description:
            "The image captures a serene harbor scene under a setting sun, with a prominent building in the background. The building is a combination of brick and stone, with a roof that is partially obscured by a white structure. The building's facade is adorned with a few windows, and a staircase is visible on the right side of the image.\n\nIn the foreground, there are several boats moored to the dock, with one boat prominently displayed and positioned closer to the camera. The boats are predominantly white, with some green accents, and are positioned in a line, with the boat closest to the camera slightly ahead.\n\nThe water in the harbor is calm, reflecting the sky above. The overall atmosphere is tranquil and picturesque, with the building and boats providing a sense of calm and serenity. The image is taken from a high vantage point, providing a comprehensive view of the harbor and its surroundings.",
          at_time: "2025-10-03 23:44:21.403+02",
          path: "/tmp/birdview_frames/6d7873d8-17d6-4886-b5e4-5b81793ed026.jpg",
          stream_id: "camera-6",
          score: 1.0101739990804015,
          "score:1": 1.0101739990804015,
        },
        {
          id: "189ef543-2f27-4491-adb1-08213d00b11a",
          description:
            "The image depicts a nighttime scene at a harbor, with a dark, foggy atmosphere. The water is calm, reflecting the light of the surrounding buildings and vehicles. The perspective is from a low angle, looking up at the water, which is slightly obscured by the fog. The buildings and vehicles are illuminated by streetlights, creating a stark contrast against the dark backdrop.\n\nIn the foreground, there are several boats, some of which are partially submerged in the water. The boats are mostly dark, with some illuminated by streetlights, indicating that they are either occupied or waiting for their turn to be docked. The boats are positioned in a line, with some closer to the water's edge and others further out.\n\nThe water's surface is disturbed by the movement of the boats, creating ripples and creating a sense of motion. The overall mood of the image is one of calm and quiet, with the dark, foggy atmosphere providing a stark contrast to the light-filled water.",
          at_time: "2025-10-03 23:48:29.714+02",
          path: "/tmp/birdview_frames/189ef543-2f27-4491-adb1-08213d00b11a.jpg",
          stream_id: "camera-5",
          score: 0.9980303846227975,
          "score:1": 0.9980303846227975,
        },
        {
          id: "13c1d7ba-fb1b-45af-a6f7-1c5f9de3e37b",
          description:
            "The image depicts a nighttime scene at a harbor, with a dark, foggy atmosphere. The water is calm, reflecting the light of the surrounding buildings and vehicles. The perspective is from a low angle, looking up at the water, which is slightly obscured by the fog.\n\nIn the foreground, there are several boats, some of which are illuminated by their lights, indicating that they are either passing by or are actively engaged in their activities. The boats are positioned in a line, with some closer to the camera and others further away, suggesting a sense of depth and distance.\n\nThe buildings in the background are lit up, with some lights illuminating the water and the boats, indicating that they are either docked or are actively engaged in their activities. The buildings are not clearly visible, but their presence suggests that they are part of the harbor's infrastructure.\n\nThe overall mood of the image is one of calm and quiet, with the dark fog and the boats providing a stark contrast to the lighter surroundings. The image captures a moment of tranquility and solitude, with the boats and the fog providing a sense of isolation and stillness.",
          at_time: "2025-10-03 23:46:49.232+02",
          path: "/tmp/birdview_frames/13c1d7ba-fb1b-45af-a6f7-1c5f9de3e37b.jpg",
          stream_id: "camera-5",
          score: 0.9522416191092365,
          "score:1": 0.9522416191092365,
        },
        {
          id: "c15166a0-e5d1-4b5a-a50d-ba000e26b68a",
          description:
            "The image captures a serene harbor scene under a setting sun, with a prominent building in the background. The building is a multi-story structure with a gray roof, and it is adorned with numerous windows and a staircase leading up to the second floor. The building's facade is adorned with a variety of architectural elements, including a clock tower and a decorative archway.\n\nThe harbor itself is a tranquil body of water, with calm waters reflecting the sky above. Several boats are docked at the harbor, including a white boat with a blue stripe, a small white boat, and a white boat with a blue stripe. The boats are positioned in a row, with the white boat closest to the camera and the white boat further away.\n\nThe sky is a clear blue, suggesting a pleasant day. The overall atmosphere of the scene is calm and serene, with the boats and the building in the background providing a sense of depth and perspective. The image is a beautiful representation of a tranquil harbor scene under the warm glow of the setting sun.",
          at_time: "2025-10-03 23:43:17.861+02",
          path: "/tmp/birdview_frames/c15166a0-e5d1-4b5a-a50d-ba000e26b68a.jpg",
          stream_id: "camera-6",
          score: 0.9005935582189177,
          "score:1": 0.9005935582189177,
        },
        {
          id: "a83019e4-250e-47b1-9643-1e46c0345a00",
          description:
            "The image captures a serene harbor scene under a setting sun, with a prominent building in the background. The building is a multi-story structure with a gray roof, and it is adorned with multiple windows and a balcony. The building's structure is characterized by a mix of light and dark tones, with the gray roof contrasting with the darker tones of the windows and the balcony.\n\nThe harbor itself is a tranquil body of water, with calm waters reflecting the sky above. Several boats are docked at the harbor, including a white boat with a blue stripe, a small white boat, and a white boat with a blue stripe. The boats are positioned in a row, with the white boat closest to the camera and the white boat further away.\n\nThe sky is a clear blue, suggesting a sunny day. The overall atmosphere of the image is calm and serene, with the boats and the building in the background providing a sense of depth and perspective. The image is a beautiful representation of a tranquil harbor scene under the warm glow of the setting sun.",
          at_time: "2025-10-03 23:42:46.282+02",
          path: "/tmp/birdview_frames/a83019e4-250e-47b1-9643-1e46c0345a00.jpg",
          stream_id: "camera-6",
          score: 0.8957352337176291,
          "score:1": 0.8957352337176291,
        },
        {
          id: "aaa3f184-e54b-47ed-a736-7cfa59fedaa8",
          description:
            "The image depicts a nighttime scene at a harbor, with a boat visible in the foreground. The boat is moving towards the right side of the frame, with its lights reflecting off the water. The boat is surrounded by a dense array of lights, including streetlights, streetlights, and streetlights, indicating a bustling urban environment. The water is calm, with the boat's wake visible, suggesting it is moving slowly. The sky is overcast, casting a soft, diffused light over the scene.\n\nThe harbor is bustling with activity, with numerous boats and ships visible in the background. The boats are mostly stationary, with some moving closer to the camera, while others are stationary, possibly docked or stationary. The overall atmosphere suggests a lively and active harbor, possibly during the day.\n\nThe image does not contain any discernible text or additional objects. The relative positions of the objects suggest a typical nighttime scene at a harbor, with the boat moving towards the right side of the frame and the boats stationary. The overall composition of the image is one of activity and movement, with the boat in motion and the boats stationary.",
          at_time: "2025-10-03 23:43:32.087+02",
          path: "/tmp/birdview_frames/aaa3f184-e54b-47ed-a736-7cfa59fedaa8.jpg",
          stream_id: "camera-5",
          score: 0.8909290452103346,
          "score:1": 0.8909290452103346,
        },
        {
          id: "e4e11ffb-01df-468b-b44b-3c76f2a178d6",
          description:
            "The image depicts a nighttime scene at a harbor, where numerous boats are docked and illuminated by their lights. The boats are positioned in a line, with some closer to the camera and others further away, creating a sense of depth and perspective. The water is calm, with no visible waves or ripples, indicating a calm sea. The sky is overcast, casting a soft, diffused light over the scene.\n\nIn the foreground, there are several boats, some of which are closer to the camera and others further away. The boats are predominantly dark in color, with some lighter hues visible, possibly due to the overcast sky. The boats are positioned in a line, with some closer to the camera and others further away.\n\nThe water is calm, with no visible waves or ripples, suggesting a calm sea. The overall atmosphere is one of tranquility and calm, with the boats and the surrounding environment providing a serene backdrop.\n\nThe image does not contain any discernible text or additional objects. The relative positions of the boats and the water suggest a well-organized harbor, with the boats positioned in a way that creates a sense of depth and perspective. The overall composition of the image is one of calm water and calm boats, with a focus on the",
          at_time: "2025-10-03 23:42:30.878+02",
          path: "/tmp/birdview_frames/e4e11ffb-01df-468b-b44b-3c76f2a178d6.jpg",
          stream_id: "camera-5",
          score: 0.8814697549064887,
          "score:1": 0.8814697549064887,
        },
        {
          id: "10d7ac72-a9af-4d71-95db-d6ae4e5fb866",
          description:
            "The image depicts a nighttime scene at a body of water, likely a lake or a river, illuminated by a single light source. The light source is positioned towards the left side of the frame, casting a soft glow on the water's surface. The water is calm, with no visible waves or ripples, suggesting it might be a calm night.\n\nIn the foreground, there is a structure or structure that appears to be a dock or pier, with a few lights visible on the structure, possibly indicating that it is a boat or a small boat. The structure is relatively small, with a single light source positioned towards the left side of the frame.\n\nThe water is dark, with no visible reflections or reflections on the surface, indicating that it is likely a dark, possibly nighttime environment. The overall lighting is low, with the light source being the only source of illumination.\n\nThere are no discernible texts or other objects in the image, and the relative positions of the objects suggest a peaceful, undisturbed setting. The image does not provide any information about the time of day or the location, but it does provide a clear and detailed view of a nighttime scene at a body of water.",
          at_time: "2025-10-03 23:48:25.556+02",
          path: "/tmp/birdview_frames/10d7ac72-a9af-4d71-95db-d6ae4e5fb866.jpg",
          stream_id: "camera-3",
          score: 0.8814697549064887,
          "score:1": 0.8814697549064887,
        },
        {
          id: "1e34fe26-f3d7-4971-85fc-e1eeaf7c2478",
          description:
            "The image depicts a nighttime scene at a harbor, where a boat is seen moving through the water. The boat is moving from the left to the right, with its wake visible in the foreground. The water is calm, with no visible waves or ripples, indicating a calm and undisturbed environment. The sky is overcast, with a dark, hazy atmosphere, suggesting a nighttime setting.\n\nIn the foreground, there is a boat with a dark hull and a white deck, moving towards the right side of the image. The boat is moving from the left to the right, with its wake visible in the foreground. The water is calm, with no visible waves or ripples, indicating a calm and undisturbed environment.\n\nThe background shows a line of buildings, possibly a harbor or dock, with numerous lights illuminating the area. The buildings are lit up, creating a bright, illuminated area that contrasts with the dark water and the boat's movement.\n\nThe image captures a moment of calm and tranquility, with the boat moving through the water and the buildings in the background providing a sense of depth and perspective. The overall scene is one of quiet and peaceful, with the boat moving through the water and the buildings providing a sense of depth and perspective.",
          at_time: "2025-10-03 23:47:14.392+02",
          path: "/tmp/birdview_frames/1e34fe26-f3d7-4971-85fc-e1eeaf7c2478.jpg",
          stream_id: "camera-5",
          score: 0.8542598705050045,
          "score:1": 0.8542598705050045,
        },
        {
          id: "722a6ebb-3867-4dae-b581-09285205af78",
          description:
            "The image captures a serene harbor scene under a setting sun, with a prominent building in the background. The building is a multi-story structure with a gray roof, and it is adorned with numerous windows and a staircase leading up to the upper level. The building's structure is characterized by a mix of light and dark tones, with the gray roof contrasting with the darker tones of the windows and the staircase.\n\nThe harbor itself is a tranquil body of water, with calm waters reflecting the sky above. Several boats are docked at the harbor, including a white boat with a blue stripe, a small white boat, and a larger white boat with a blue stripe. The boats are positioned in a row, with the white boat closest to the camera and the larger white boat further away.\n\nThe harbor is surrounded by a brick wall, which is partially visible in the image. The wall is adorned with a few decorative elements, including a lantern and a small lamp, adding to the nautical ambiance.\n\nThe sky is a clear, golden hour, suggesting a warm, sunny day. The overall scene conveys a sense of calm and tranquility, with the harbor and its surroundings providing a picturesque backdrop.",
          at_time: "2025-10-03 23:42:29.31+02",
          path: "/tmp/birdview_frames/722a6ebb-3867-4dae-b581-09285205af78.jpg",
          stream_id: "camera-6",
          score: 0.8328360197004233,
          "score:1": 0.8328360197004233,
        },
        {
          id: "7739698b-b7a5-429d-85d1-19284f946692",
          description:
            "The image captures a serene harbor scene under a setting sun, with a prominent building in the background. The building is a multi-story structure with a gray roof, and it is adorned with green and white accents. The building's windows are adorned with a variety of green and white lights, adding a touch of color to the scene.\n\nThe harbor itself is a deep blue, reflecting the light of the setting sun. Several boats are docked at the harbor, including a white boat with a blue stripe, a small white boat, and a white boat with a blue stripe. The boats are positioned in a row, with the white boat closest to the camera and the white boat further away.\n\nThe water in the harbor is calm, with gentle ripples indicating the gentle movement of the water. The sky is a gradient of orange and yellow, suggesting the setting sun, casting a warm glow over the scene.\n\nThe image is a blend of natural and man-made elements, with the building and boats as the primary subjects. The colors are vivid, with the blue of the water contrasting with the green and white of the buildings and boats. The image is a beautiful representation of a tranquil harbor scene under the warm glow of the setting sun.",
          at_time: "2025-10-03 23:42:24.163+02",
          path: "/tmp/birdview_frames/7739698b-b7a5-429d-85d1-19284f946692.jpg",
          stream_id: "camera-6",
          score: 0.8164554127628334,
          "score:1": 0.8164554127628334,
        },
      ],
    },
  });

  const [query, setQuery] = createSignal("");

  let searchTimeout: any = null;

  // createEffect(() => {
  //   const q = query().trim();
  //   if (searchTimeout) clearTimeout(searchTimeout);
  //   if (q === "") {
  //     setState({ type: "result", result: { items: [] } });
  //     return;
  //   }
  //   setState({ type: "searching", query: q });
  //   searchTimeout = setTimeout(() => {
  //     const msg = createMessage({ type: "search", query: q });
  //     console.log("Sending search message", msg);
  //     socket?.send(msg);
  //   }, 500);
  // });

  createEffect(() => {
    const msg = latestWsMessage();
    if (!msg) return;
    if (msg.header.type === "search_result") {
      console.log("Received search result", msg);
      if (msg.header.query !== untrack(query)) return; // Ignore old results
      setState({
        type: "result",
        query: msg.header.query,
        result: msg.header.result,
      });
    }

    if (msg.header.type === "get_image_result") {
      if (!msg.imageBuffer) return;
      setCachedImages(msg.header.path, msg.imageBuffer);
    }
  });

  onMount(() => {
    const listener = (e: MouseEvent) => {
      const bar = untrack(barRef);
      if (!bar) return;
      const isInside = bar === e.target || bar.contains(e.target as any);
      setIsOpen(isInside);
    };
    onCleanup(() => {
      document.removeEventListener("click", listener);
    });

    document.addEventListener("click", listener);
  });

  const isEmptyResult = () =>
    state().type === "result" && (state().result?.items.length ?? 0) == 0;

  return (
    <div>
      <Show when={isOpen()}>
        <div class="fixed h-[100vh] w-[100vw] top-0 left-0  z-[100]" />
      </Show>
      <div
        ref={setBarRef}
        data-variant={variant()}
        data-open={isOpen()}
        class="z-[200] absolute top-1 left-1/2 -translate-x-1/2 w-[24rem] data-[variant=lg]:w-[40vw] data-[open=true]:top-10 transition-[top,width,box-shadow] duration-300 ease-in-out data-[open=true]:w-[50vw] data-[variant=lg]:data-[open=true]:w-[50vw] data-[open=true]:drop-shadow-lg  data-[open=true]:border border-neutral-800  data-[open=false]:rounded-full  data-[open=true]:rounded-2xl overflow-hidden bg-neutral-900 data-[open=true]:bg-neutral-900 "
      >
        <div
          data-variant={variant()}
          data-open={isOpen()}
          class="relative  h-10 data-[variant=lg]:h-16 data-[open=true]:text-xl data-[open=true]:h-12 data-[open=true]:data-[variant=lg]:h-20   group "
        >
          <div
            data-open={isOpen()}
            class="absolute top-1/2 -translate-y-1/2 left-0 h-full flex items-center pl-4 data-[open=true]:pl-4 "
          >
            <BsSearch
              data-open={isOpen()}
              class="w-5 h-5 data-[open=true]:w-6 data-[open=true]:h-6 text-neutral-400 group-hover:text-white  transition-all duration-100 "
            />
          </div>

          <div
            data-open={isOpen()}
            class="h-full flex items-center justify-center data-[open=true]:justify-end"
          >
            <input
              value={query()}
              onInput={(e) => {
                setQuery(e.currentTarget.value);
              }}
              data-open={isOpen()}
              data-variant={variant()}
              class="w-[calc(100%-3rem)] 
              data-[variant=lg]:text-xl
              h-full  placeholder:text-neutral-400  transition-all duration-100  px-2 focus:outline-none text-center data-[open=true]:text-left min-w-0"
              placeholder={isOpen() ? "" : placeholder()}
            />
          </div>
        </div>

        <Show when={isOpen()}>
          <div
            data-empty={isEmptyResult()}
            class="h-[50vh] data-empty:h-80 w-full border-t border-neutral-800 overflow-auto"
          >
            <Show
              when={isEmptyResult()}
              fallback={
                <div>
                  <For each={state().result?.items}>
                    {(item) => {
                      const name = () =>
                        config()?.streams[item.stream_id]?.label ||
                        item.stream_id;

                      const imgUrl = () => {
                        if (!cachedImages[item.path]) return null;

                        // 1. Create a blob from the ArrayBuffer
                        const blob = new Blob([cachedImages[item.path]], {
                          type: "image/jpeg",
                        });

                        // 2. Create an object URL from the blob
                        const imageUrl = URL.createObjectURL(blob);
                        return imageUrl;
                      };

                      if (!imgUrl()) {
                        const msg = createMessage({
                          type: "get_image",
                          path: item.path,
                        });
                        socket?.send(msg);
                      }

                      const desc = () => {
                        const removePrefixes = [
                          "This image depicts",
                          "The image depicts",
                          "The image shows",
                          "This image shows",
                          "The image captures",
                          "This image captures",
                        ];

                        let d = item.description.trim();
                        for (const prefix of removePrefixes) {
                          if (d.startsWith(prefix)) {
                            d = d.slice(prefix.length).trim();
                            // capitalize first letter
                            if (d.length > 0) {
                              d = d.charAt(0).toUpperCase() + d.slice(1);
                            }
                          }
                        }

                        return d;
                      };

                      return (
                        <div class="p-4 hover:bg-neutral-800 cursor-pointer flex items-start space-x-4">
                          <div class="flex-1">
                            <div class="flex items-center space-x-2 py-2">
                              <BiSolidCctv class="w-4 h-4 text-neutral-400" />
                              <div>{name()}</div>
                              <div>•</div>
                              <div class="text-sm">
                                {format(
                                  item.at_time,
                                  "eeee, MMMM do, yyyy 'at' h:mm a"
                                )}
                              </div>
                            </div>

                            <div class="text-xs line-clamp-2">{desc()}</div>

                            <div class="pt-4 flex items-center">
                              <div class="text-xs text-[#a3eeef] border border-[#4c6f73] rounded-full bg-[#28393e] px-2 py-1">
                                {/* Rounded to 2 decimal places */}
                                relevant: {item.score.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div class="flex-none h-full">
                            <div class="h-24 w-32 object-cover rounded-lg bg-neutral-800 overflow-hidden">
                              <Show when={imgUrl()}>
                                {(u) => (
                                  <img
                                    src={u()}
                                    class="w-full h-full object-cover"
                                  />
                                )}
                              </Show>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              }
            >
              <div class="flex items-center h-full justify-center">
                <div class="flex flex-col items-center ">
                  <NoResultIcon />
                  <div class="font-medium mt-2">No results found</div>
                  <div class="text-center text-neutral-500 mt-1">
                    We couldn't find any results.
                    <br />
                    Try adjusting your search or use different keywords.
                  </div>
                  <button class="mt-6 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-all duration-100 px-4 py-2 drop-shadow-2xl bg-neutral-900">
                    Clear search
                  </button>
                </div>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}
