import { getSocialGames } from "@/api/social";
import { LetterState, type SocialGameDetail } from "@/api/types";
import { WORDLE_WORD_LENGTH } from "@/constants";
import clsx from "clsx";
import { useEffect, useState } from "react";

type SocialSidebarProps = {
  accessToken: string;
};

export function SocialSidebar({ accessToken }: SocialSidebarProps) {
  const [socialGames, setSocialGames] = useState<SocialGameDetail[]>([]);

  // TODO)) Update social game data in realtime (polling/websocket)
  useEffect(() => {
    if (!accessToken) return;

    const inner = async () => {
      const social = await getSocialGames(accessToken);
      setSocialGames(social);
    };
    inner();
  }, [accessToken]);

  // TODO)) Improve sorting
  // TODO)) Place own guess at the top
  const sortedGames = socialGames.sort((a, b) => {
    if (a.state === "solved" && b.state === "solved") {
      if (a.guesses.length === b.guesses.length) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return a.guesses.length - b.guesses.length;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="flex flex-col gap-2">
      {sortedGames.map((game) => (
        <SocialCard key={game.id} game={game} />
      ))}
    </div>
  );
}

function SocialCard({ game }: { game: SocialGameDetail }) {
  const displayName = game.user.globalName ?? game.user.username;
  return (
    <div
      className="flex flex-col max-w-min items-center gap-2 bg-mist-800 p-2 border-2 border-gray-600 rounded-lg"
      title={displayName}
    >
      <div className="w-15 aspect-square rounded-full  overflow-hidden">
        <img className="w-full h-full" src={game.user.avatarURL} alt={displayName} />
      </div>
      <GuessGrid game={game} />
      {/* TODO: "Share" button under own guess */}
    </div>
  );
}

function GuessGrid({ game }: { game: SocialGameDetail }) {
  return (
    <div className="flex flex-col gap-0.5">
      {game.guesses.map((guess) => (
        <div className="flex flex-row gap-0.5" key={`${game.id}:${guess.index}`}>
          {guess.states.map((state, idx) => (
            <div
              className={clsx([
                "w-3 aspect-square",
                state === LetterState.CORRECT && "bg-green-500",
                state === LetterState.PRESENT && "bg-yellow-400",
                state === LetterState.ABSENT && "bg-gray-500",
              ])}
              key={`${game.id}:${guess.index}:${idx}`}
            >
              {" "}
            </div>
          ))}
        </div>
      ))}
      {game.state === "inProgress" && (
        <div className="flex flex-row gap-0.5" key={`${game.id}:pending`}>
          {Array.from(Array(WORDLE_WORD_LENGTH)).map((_, idx) => (
            <div
              className="w-3 aspect-square border border-gray-500"
              key={`${game.id}:pending:${idx}`}
            >
              {" "}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
