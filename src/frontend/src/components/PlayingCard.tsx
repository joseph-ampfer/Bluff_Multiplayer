import type { LiarCard } from '../../../shared/types';
import '../App.css';

/**
 * A component that displays a playing card.
 * @param card - The card to display.
 * @param selected - Whether the card is selected.
 * @param disabled - Whether the card is disabled.
 * @param onToggle - A function to toggle the card.
 * @returns A button that displays the card.
 */
export const PlayingCard = ({ card, selected, disabled, onToggle, style, played }: { card: LiarCard, selected: boolean, disabled: boolean, onToggle: () => void, style?: string, played?: boolean }) => { 

  return (

    <button disabled={disabled || played} className={`playing-card ${played ? 'played' : ''} ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}  ${style ? style : ''}`} onClick={() => onToggle()}>
      <p>{played ? 'Liar\'s Deck': card.rank}</p>
    </button>
    
  )
}