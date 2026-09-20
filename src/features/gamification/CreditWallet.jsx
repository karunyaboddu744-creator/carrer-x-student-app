import React from 'react';
import {
  Coins,
  Trophy,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  getLevelProgress,
  formatCredits,
} from './creditRules';

export default function CreditWallet({
  credits = 0,
  compact = false,
}) {
  const {
    currentLevel,
    nextLevel,
    progress,
    remaining,
  } = getLevelProgress(credits);

  return (
    <div className={`credit-wallet ${compact ? 'compact' : ''}`}>
      <div className="credit-wallet-top">
        <div className="credit-wallet-title">
          <div className="credit-icon">
            <Coins size={20} />
          </div>

          <div>
            <span>CARRER-X CREDITS</span>
            <strong>{formatCredits(credits)}</strong>
          </div>
        </div>

        <div className="credit-level">
          <Trophy size={15} />
          {currentLevel.icon} {currentLevel.name}
        </div>
      </div>

      {!compact && (
        <>
          <div className="credit-progress-header">
            <span>
              {nextLevel
                ? `${remaining} credits to ${nextLevel.name}`
                : 'Maximum level reached'}
            </span>

            <b>{progress}%</b>
          </div>

          <div className="credit-progress">
            <div
              className="credit-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="credit-wallet-footer">
            <span>
              <Sparkles size={14} />
              Keep learning to earn more credits
            </span>

            {nextLevel && (
              <span>
                Next: {nextLevel.icon} {nextLevel.name}
                <ArrowUpRight size={14} />
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}