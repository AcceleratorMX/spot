import { notFound } from "next/navigation";
import { getBoardById } from "@/app/actions/boards";
import { BoardView } from "@/components/boards/board-view";

type BoardPageProps = {
  params: Promise<{
    boardId: string;
    locale: string;
  }>;
};

export default async function BoardDetailPage({ params }: BoardPageProps) {
  const { boardId } = await params;
  const board = await getBoardById(boardId);

  if (!board) {
    notFound();
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <BoardView key={board.id} board={board} />
      </div>
    </div>
  );
}
