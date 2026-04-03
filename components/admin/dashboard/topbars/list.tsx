import React from "react";
import TopBarListItem from "./list.item";

const ListAllTopBars = ({
  topBars,
  setTopBars,
}: {
  topBars: any;
  setTopBars: React.Dispatch<React.SetStateAction<any>>;
}) => {
  // Filter out any undefined or invalid topBar items
  const validTopBars = topBars?.filter((topBar: any) => topBar && topBar._id) || [];

  return (
    <div>
      <ul className="mt-[1rem]">
        {validTopBars.length > 0 ? (
          validTopBars.map((topBar: any) => (
            <TopBarListItem
              topBar={topBar}
              key={topBar._id}
              setTopBars={setTopBars}
            />
          ))
        ) : (
          <li className="text-gray-500 p-4">No top bars found.</li>
        )}
      </ul>
    </div>
  );
};

export default ListAllTopBars;
