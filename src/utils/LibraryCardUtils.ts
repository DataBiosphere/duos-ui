import { LibraryCard } from 'src/libs/ajax/LibraryCard';
import { LibraryCard as LibraryCardType } from 'src/types/model';
import { extractError } from './ErrorUtils';

interface ProcessCardResult {
  successfulCards: LibraryCardType[];
  failedCards: { card: LibraryCardType; error: string }[];
}

/**
 * Process issuing multiple library cards through the single-issue API
 *
 * @param cards - Array of library card objects to be processed
 * @returns ProcessCardResult containing arrays of successful and failed cards, with error messages for failures
 */
export const processLibraryCards = async (cards: LibraryCardType[]): Promise<ProcessCardResult> => {
  const successfulCards: LibraryCardType[] = [];
  const failedCards: { card: LibraryCardType; error: string }[] = [];

  // Process each card individually
  // Future enhancements rely on a bulk API, but for now we handle them one by one
  for (const card of cards) {
    try {
      const newCard = await LibraryCard.createLibraryCard(card);
      successfulCards.push(newCard);
    } catch (error) {
      const errorMessage = extractError(error);
      failedCards.push({ card, error: errorMessage });
    }
  }

  return { successfulCards, failedCards };
};
