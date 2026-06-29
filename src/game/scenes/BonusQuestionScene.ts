import Phaser from 'phaser';
import questionsData from '../../../data/static/questions.json';
import { playerService } from '../services/PlayerService';
import type { PlayerSave } from '../types/PlayerSave';
import type { Question } from '../types/Question';

type BonusQuestionSceneData = {
  playerId?: string;
  source?: 'menu' | 'reward';
};

const questions = questionsData as Question[];

export class BonusQuestionScene extends Phaser.Scene {
  private playerId: string | null = null;
  private source: 'menu' | 'reward' = 'menu';
  private playerSave: PlayerSave | null = null;
  private question: Question | null = null;
  private answered = false;
  private answerButtons: Phaser.GameObjects.Text[] = [];
  private moneyText?: Phaser.GameObjects.Text;
  private statsText?: Phaser.GameObjects.Text;
  private resultText?: Phaser.GameObjects.Text;
  private continueButton?: Phaser.GameObjects.Text;

  constructor() {
    super('BonusQuestionScene');
  }

  init(data: BonusQuestionSceneData): void {
    this.playerId = data.playerId ?? null;
    this.source = data.source ?? 'menu';
    this.playerSave = null;
    this.question = null;
    this.answered = false;
    this.answerButtons = [];
  }

  create(): void {
    this.playerSave = this.playerId
      ? playerService.loadPlayer(this.playerId)
      : null;

    if (!this.playerSave || questions.length === 0) {
      this.scene.start('StartScene');
      return;
    }

    this.question = questions[Phaser.Math.Between(0, questions.length - 1)];
    this.cameras.main.setBackgroundColor('#08111f');
    this.drawBackdrop();

    this.add
      .text(this.scale.width / 2, 26, 'Bonus Question', {
        color: '#d8e4ed',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add.text(50, 58, `Pilot: ${this.playerSave.name}`, {
      color: '#8effb6',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
    });

    this.moneyText = this.add
      .text(910, 58, '', {
        color: '#f4d35e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
      })
      .setOrigin(1, 0);

    this.statsText = this.add.text(50, 86, '', {
      color: '#91a4bd',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
    });

    this.add.text(
      50,
      112,
      `${this.question.subject.toUpperCase()} · ${this.question.difficulty.toUpperCase()}`,
      {
        color: '#57d4ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      },
    );

    this.add.text(50, 142, this.question.prompt, {
      color: '#f4f7fb',
      fixedWidth: 860,
      fontFamily: 'system-ui, sans-serif',
      fontSize: '23px',
      lineSpacing: 4,
      wordWrap: { width: 850 },
    });

    this.question.options.forEach((option, index) => {
      const x = index % 2 === 0 ? 50 : 490;
      const y = index < 2 ? 215 : 295;
      const button = this.createAnswerButton(x, y, index, option);
      this.answerButtons.push(button);
    });

    this.resultText = this.add
      .text(this.scale.width / 2, 375, '', {
        color: '#c8d3df',
        fixedWidth: 680,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5, 0);

    this.createNavigationButton(86, 455, 'Back', () => this.goBack());
    this.continueButton = this.createNavigationButton(
      850,
      455,
      'Continue',
      () => this.continueAfterAnswer(),
    ).setVisible(false);

    this.updatePlayerSummary();
  }

  private createAnswerButton(
    x: number,
    y: number,
    answerIndex: number,
    option: string,
  ): Phaser.GameObjects.Text {
    const label = `${String.fromCharCode(65 + answerIndex)}. ${option}`;
    const button = this.add
      .text(x, y, label, {
        backgroundColor: '#143652',
        color: '#f4f7fb',
        fixedWidth: 420,
        fixedHeight: 60,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        padding: { x: 14, y: 10 },
        wordWrap: { width: 390 },
      })
      .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      if (!this.answered) {
        button.setBackgroundColor('#1d547d');
      }
    });
    button.on('pointerout', () => {
      if (!this.answered) {
        button.setBackgroundColor('#143652');
      }
    });
    button.on('pointerup', () => this.answerQuestion(answerIndex));

    return button;
  }

  private answerQuestion(answerIndex: number): void {
    if (this.answered || !this.question || !this.playerId) {
      return;
    }

    this.answered = true;
    const correct = answerIndex === this.question.correctOptionIndex;
    const result = playerService.recordQuestionAnswer(
      this.playerId,
      this.question.subject,
      correct,
    );

    if (result.status === 'missing-player') {
      this.scene.start('StartScene');
      return;
    }

    this.playerSave = result.player;
    this.answerButtons.forEach((button, index) => {
      button.disableInteractive();

      if (index === this.question?.correctOptionIndex) {
        button.setBackgroundColor('#246b45');
      } else if (index === answerIndex) {
        button.setBackgroundColor('#7a3039');
      } else {
        button.setBackgroundColor('#2a3440');
        button.setColor('#91a4bd');
      }
    });

    const resultLabel = correct
      ? `Correct! +${result.rewardMoney} cr`
      : 'Incorrect. No money lost.';
    const correctAnswer =
      this.question.options[this.question.correctOptionIndex];
    this.resultText
      ?.setColor(correct ? '#8effb6' : '#ffb0b7')
      .setText(`${resultLabel} Correct answer: ${correctAnswer}`);
    this.continueButton?.setVisible(true);
    this.updatePlayerSummary();
  }

  private updatePlayerSummary(): void {
    if (!this.playerSave) {
      return;
    }

    const stats = this.playerSave.questionStats;
    this.moneyText?.setText(`Money: ${this.playerSave.money} cr`);
    this.statsText?.setText(
      `Answers: ${stats.answered} · Correct: ${stats.correct} · Math: ${stats.mathCorrect}/${stats.mathAnswered} · English: ${stats.englishCorrect}/${stats.englishAnswered}`,
    );
  }

  private continueAfterAnswer(): void {
    if (!this.answered || !this.playerId) {
      return;
    }

    if (this.source === 'reward') {
      this.openMissions();
      return;
    }

    this.scene.restart({ playerId: this.playerId, source: 'menu' });
  }

  private goBack(): void {
    if (this.source === 'reward') {
      this.openMissions();
      return;
    }

    this.scene.start('StartScene');
  }

  private openMissions(): void {
    this.scene.start('MissionSelectScene', {
      playerId: this.playerId,
      fromScene: 'StartScene',
    });
  }

  private createNavigationButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        backgroundColor: '#143652',
        color: '#f4f7fb',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setBackgroundColor('#1d547d'));
    button.on('pointerout', () => button.setBackgroundColor('#143652'));
    button.on('pointerup', onClick);

    return button;
  }

  private drawBackdrop(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x0b1524, 1);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);
    graphics.fillStyle(0x102235, 1);
    graphics.fillRect(30, 52, 900, 410);
    graphics.lineStyle(2, 0x2a4b68, 0.9);
    graphics.strokeRect(30, 52, 900, 410);
    graphics.fillStyle(0x08111f, 0.9);
    graphics.fillRect(30, 442, 900, 20);
  }
}
