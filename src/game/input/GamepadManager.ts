import type { GamepadInfo } from './types';

export class GamepadManager {
  private static instance: GamepadManager;
  private connectedGamepads: Map<number, Gamepad> = new Map();
  private listeners: Array<(gamepads: GamepadInfo[]) => void> = [];
  private animationFrame: number = 0;
  
  private constructor() {
    this.setupEventListeners();
    this.startPolling();
  }
  
  static getInstance(): GamepadManager {
    if (!GamepadManager.instance) {
      GamepadManager.instance = new GamepadManager();
    }
    return GamepadManager.instance;
  }
  
  private setupEventListeners(): void {
    window.addEventListener('gamepadconnected', (event) => {
      console.log('Gamepad connected:', event.gamepad.id);
      this.connectedGamepads.set(event.gamepad.index, event.gamepad);
      this.notifyListeners();
    });
    
    window.addEventListener('gamepaddisconnected', (event) => {
      console.log('Gamepad disconnected:', event.gamepad.id);
      this.connectedGamepads.delete(event.gamepad.index);
      this.notifyListeners();
    });
  }
  
  private startPolling(): void {
    const poll = () => {
      // Chrome requires polling to get updated gamepad state
      const gamepads = navigator.getGamepads();
      let updated = false;
      
      for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        if (gamepad) {
          if (!this.connectedGamepads.has(i) || this.connectedGamepads.get(i)?.timestamp !== gamepad.timestamp) {
            this.connectedGamepads.set(i, gamepad);
            updated = true;
          }
        } else if (this.connectedGamepads.has(i)) {
          this.connectedGamepads.delete(i);
          updated = true;
        }
      }
      
      this.animationFrame = requestAnimationFrame(poll);
    };
    
    poll();
  }
  
  private notifyListeners(): void {
    const info = this.getGamepadInfo();
    this.listeners.forEach(listener => listener(info));
  }
  
  public addListener(callback: (gamepads: GamepadInfo[]) => void): void {
    this.listeners.push(callback);
  }
  
  public removeListener(callback: (gamepads: GamepadInfo[]) => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }
  
  public getGamepadInfo(): GamepadInfo[] {
    return Array.from(this.connectedGamepads.values()).map(gamepad => ({
      index: gamepad.index,
      id: gamepad.id,
      connected: gamepad.connected,
      buttons: gamepad.buttons.length,
      axes: gamepad.axes.length
    }));
  }
  
  public getPrimaryGamepad(): Gamepad | null {
    if (this.connectedGamepads.size === 0) return null;
    return this.connectedGamepads.values().next().value || null;
  }
  
  public getGamepadState(index: number = 0): {
    leftStick: { x: number; y: number };
    rightStick: { x: number; y: number };
    leftTrigger: number;
    rightTrigger: number;
    buttons: boolean[];
  } {
    const gamepad = this.connectedGamepads.get(index);
    
    if (!gamepad) {
      return {
        leftStick: { x: 0, y: 0 },
        rightStick: { x: 0, y: 0 },
        leftTrigger: 0,
        rightTrigger: 0,
        buttons: []
      };
    }
    
    return {
      leftStick: {
        x: gamepad.axes[0] || 0,
        y: gamepad.axes[1] || 0
      },
      rightStick: {
        x: gamepad.axes[2] || 0,
        y: gamepad.axes[3] || 0
      },
      leftTrigger: gamepad.buttons[6] ? gamepad.buttons[6].value : 0,
      rightTrigger: gamepad.buttons[7] ? gamepad.buttons[7].value : 0,
      buttons: gamepad.buttons.map(button => button.pressed)
    };
  }
  
  public destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
    this.connectedGamepads.clear();
    this.listeners.length = 0;
    GamepadManager.instance = null as any;
  }
}