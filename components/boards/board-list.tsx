"use client";

import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { BoardCard } from "./board-card";
import {
  reorderBoards,
  toggleFavorite,
  type BoardSummaryWithRelations,
} from "@/app/actions/boards";
import { useRouter } from "next/navigation";

type BoardWithExtras = BoardSummaryWithRelations & {
  isFavorite?: boolean;
  order?: number;
};

type BoardListProps = {
  initialBoards: BoardWithExtras[];
};

export function BoardList({ initialBoards }: BoardListProps) {
  const [boards, setBoards] = useState(initialBoards);
  const [prevInitialBoards, setPrevInitialBoards] = useState(initialBoards);
  const router = useRouter();

  // Adjust state when props change without useEffect
  if (initialBoards !== prevInitialBoards) {
    setBoards(initialBoards);
    setPrevInitialBoards(initialBoards);
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(boards);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Determine new favorite status based on neighbors
    const newIndex = result.destination.index;
    const prevItem = items[newIndex - 1];
    const nextItem = items[newIndex + 1];

    let shouldBeFavorite = reorderedItem.isFavorite;

    if (prevItem && nextItem) {
      if (prevItem.isFavorite === nextItem.isFavorite) {
        shouldBeFavorite = prevItem.isFavorite || false;
      }
    } else if (prevItem) {
      shouldBeFavorite = prevItem.isFavorite || false;
    } else if (nextItem) {
      shouldBeFavorite = nextItem.isFavorite || false;
    }

    if (shouldBeFavorite !== reorderedItem.isFavorite) {
      reorderedItem.isFavorite = shouldBeFavorite;
    }

    // Optimistic update
    setBoards(items);

    // Persist to server
    const boardIds = items.map((b) => b.id);

    // If favorite status changed, update it first
    if (
      shouldBeFavorite !==
      initialBoards.find((b) => b.id === reorderedItem.id)?.isFavorite
    ) {
      await toggleFavorite(reorderedItem.id, !!shouldBeFavorite);
    }

    const response = await reorderBoards(boardIds);

    if (response.error) {
      setBoards(initialBoards);
    } else {
      router.refresh();
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="boards" direction="horizontal" type="board">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {boards.map((board, index) => (
              <Draggable key={board.id} draggableId={board.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <BoardCard board={board} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
