'use client'

import React, { useEffect, useRef, useState } from 'react'

const CANVAS_WIDTH = 288
const CANVAS_HEIGHT = 512
const BIRD_WIDTH = 34
const BIRD_HEIGHT = 24
const PIPE_WIDTH = 52
const PIPE_GAP = 120
const GRAVITY = 0.2
const JUMP_STRENGTH = 4.2
const BIRD_START_X = CANVAS_WIDTH * 0.2
const BIRD_START_Y = CANVAS_HEIGHT * 0.5
const WIN_SCORE = 100
const COLLISION_BUFFER = 4

const IMAGES = {
  background: 'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/background-day.png?raw=true',
  base: 'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/base.png?raw=true',
  bird: [
    'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/bluebird-downflap.png?raw=true',
    'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/bluebird-midflap.png?raw=true',
    'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/bluebird-upflap.png?raw=true',
  ],
  pipeTop: 'https://github.com/tinspham209/react-flappy-bird/blob/master/src/assets/pipe-top.png?raw=true',
  pipeBottom: 'https://github.com/tinspham209/react-flappy-bird/blob/master/src/assets/pipe-bottom.png?raw=true',
  getReady: 'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/message.png?raw=true',
  gameOver: 'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/gameover.png?raw=true',
  restartButton: 'https://github.com/IgorRozani/flappy-bird/blob/master/assets/restart-button.png?raw=true',
  numbers: [
    'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/0.png?raw=true',
    'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/1.png?raw=true',
    'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/2.png?raw=true',
    'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/3.png?raw=true',
    'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/4.png?raw=true',
    'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/5.png?raw=true',
    'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/6.png?raw=true',
    'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/7.png?raw=true',
    'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/8.png?raw=true',
    'https://github.com/samuelcust/flappy-bird-assets/blob/master/sprites/9.png?raw=true',
  ]
}

class Pipe {
  x: number
  y: number
  velX: number
  image: HTMLImageElement
  passed: boolean

  constructor(x: number, y: number, image: HTMLImageElement) {
    this.x = x
    this.y = y
    this.velX = -2
    this.image = image
    this.passed = false
  }

  tick() {
    this.x += this.velX
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(this.image, this.x, this.y)
  }
}

class Pipes {
  upper: Pipe[]
  lower: Pipe[]
  pipeGap: number
  config: {
    width: number
    height: number
    pipeTopImage: HTMLImageElement
    pipeBottomImage: HTMLImageElement
  }

  constructor(config: {
    width: number
    height: number
    pipeTopImage: HTMLImageElement
    pipeBottomImage: HTMLImageElement
  }) {
    this.config = config
    this.pipeGap = PIPE_GAP
    this.upper = []
    this.lower = []
    this.spawnInitialPipes()
  }

  tick() {
    if (this.canSpawnPipes()) {
      this.spawnNewPipes()
    }
    this.removeOldPipes()

    this.upper.forEach(pipe => pipe.tick())
    this.lower.forEach(pipe => pipe.tick())
  }

  stop() {
    this.upper.forEach(pipe => pipe.velX = 0)
    this.lower.forEach(pipe => pipe.velX = 0)
  }

  canSpawnPipes(): boolean {
    const last = this.upper[this.upper.length - 1]
    if (!last) {
      return true
    }
    return this.config.width - (last.x + PIPE_WIDTH) > PIPE_WIDTH * 2.5
  }

  spawnNewPipes() {
    const [upper, lower] = this.makeRandomPipes()
    this.upper.push(upper)
    this.lower.push(lower)
  }

  removeOldPipes() {
    this.upper = this.upper.filter(pipe => pipe.x > -PIPE_WIDTH)
    this.lower = this.lower.filter(pipe => pipe.x > -PIPE_WIDTH)
  }

  spawnInitialPipes() {
    const [upper1, lower1] = this.makeRandomPipes()
    upper1.x = this.config.width + PIPE_WIDTH * 3
    lower1.x = this.config.width + PIPE_WIDTH * 3
    this.upper.push(upper1)
    this.lower.push(lower1)

    const [upper2, lower2] = this.makeRandomPipes()
    upper2.x = upper1.x + PIPE_WIDTH * 3.5
    lower2.x = upper1.x + PIPE_WIDTH * 3.5
    this.upper.push(upper2)
    this.lower.push(lower2)
  }

  makeRandomPipes(): [Pipe, Pipe] {
    const baseY = this.config.height
    const gapY = Math.floor(Math.random() * (baseY * 0.6 - this.pipeGap)) + Math.floor(baseY * 0.2)
    const pipeHeight = this.config.pipeTopImage.height
    const pipeX = this.config.width + 10

    const upperPipe = new Pipe(
      pipeX,
      gapY - pipeHeight,
      this.config.pipeTopImage
    )

    const lowerPipe = new Pipe(
      pipeX,
      gapY + this.pipeGap,
      this.config.pipeBottomImage
    )

    return [upperPipe, lowerPipe]
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.upper.forEach(pipe => pipe.draw(ctx))
    this.lower.forEach(pipe => pipe.draw(ctx))
  }
}

export function FlappyBirdComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAME_OVER' | 'WIN'>('START')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const gameDataRef = useRef({
    bird: { x: BIRD_START_X, y: BIRD_START_Y, velocity: 0 },
    pipes: null as Pipes | null,
    baseX: 0,
    frameCount: 0
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const images: { [key: string]: HTMLImageElement | HTMLImageElement[] } = {}

    const loadImage = (key: string, src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          images[key] = img
          resolve()
        }
        img.onerror = reject
        img.src = src
      })
    }

    const loadImages = async () => {
      const imagePromises = Object.entries(IMAGES).map(([key, value]) => {
        if (Array.isArray(value)) {
          return Promise.all(value.map((src, index) => loadImage(`${key}${index}`, src)))
        } else {
          return loadImage(key, value)
        }
      })

      await Promise.all(imagePromises)
      gameLoop()
    }

    const resetGame = () => {
      gameDataRef.current = {
        bird: { x: BIRD_START_X, y: BIRD_START_Y, velocity: 0 },
        pipes: new Pipes({
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          pipeTopImage: images.pipeTop as HTMLImageElement,
          pipeBottomImage: images.pipeBottom as HTMLImageElement
        }),
        baseX: 0,
        frameCount: 0
      }
      setScore(0)
      setGameState('PLAYING')
    }

    const updateGame = () => {
      const gameData = gameDataRef.current
      gameData.frameCount++
      gameData.baseX = (gameData.baseX - 2) % CANVAS_WIDTH

      if (gameState === 'PLAYING') {
        // Update bird
        gameData.bird.velocity += GRAVITY
        gameData.bird.y += gameData.bird.velocity

        // Update pipes
        if (gameData.pipes) {
          gameData.pipes.tick()

          // Collision detection
          const collidedWithPipe = [...gameData.pipes.upper, ...gameData.pipes.lower].some(pipe => {
            const birdRight = gameData.bird.x + BIRD_WIDTH / 2 - COLLISION_BUFFER
            const birdLeft = gameData.bird.x - BIRD_WIDTH / 2 + COLLISION_BUFFER
            const birdTop = gameData.bird.y - BIRD_HEIGHT / 2 + COLLISION_BUFFER
            const birdBottom = gameData.bird.y + BIRD_HEIGHT / 2 - COLLISION_BUFFER

            const pipeRight = pipe.x + PIPE_WIDTH
            const pipeLeft = pipe.x

            // Horizontal collision check
            const horizontalCollision = birdRight > pipeLeft && birdLeft < pipeRight

            // Different vertical checks for upper and lower pipes
            if (gameData.pipes?.upper.includes(pipe)) {
              return horizontalCollision && birdTop < pipe.y + pipe.image.height
            } else {
              return horizontalCollision && birdBottom > pipe.y
            }
          })

          if (collidedWithPipe) {
            setGameState('GAME_OVER')
          }

          // Score update
          const passedPipe = gameData.pipes.upper.find(pipe => 
            !pipe.passed && pipe.x + PIPE_WIDTH < gameData.bird.x
          )

          if (passedPipe) {
            passedPipe.passed = true
            setScore(prevScore => {
              const newScore = prevScore + 1
              if (newScore >= WIN_SCORE) {
                setGameState('WIN')
              }
              return newScore
            })
          }
        }

        // Ground collision
        if (gameData.bird.y + BIRD_HEIGHT / 2 > CANVAS_HEIGHT - 112) {
          setGameState('GAME_OVER')
        }
      }
    }

    const drawBackground = () => {
      if (images.background instanceof HTMLImageElement) {
        ctx.drawImage(images.background, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      }
    }

    const drawBase = () => {
      if (images.base instanceof HTMLImageElement) {
        ctx.drawImage(images.base, gameDataRef.current.baseX, CANVAS_HEIGHT - 112, CANVAS_WIDTH, 112)
        ctx.drawImage(images.base, gameDataRef.current.baseX + CANVAS_WIDTH, CANVAS_HEIGHT - 112, CANVAS_WIDTH, 112)
      }
    }

    const drawBird = () => {
      const birdImage = images[`bird${gameDataRef.current.frameCount % 3}`]
      if (birdImage instanceof HTMLImageElement) {
        ctx.save()
        ctx.translate(gameDataRef.current.bird.x, gameDataRef.current.bird.y)
        ctx.rotate(gameDataRef.current.bird.velocity * 0.1)
        ctx.drawImage(birdImage, -BIRD_WIDTH / 2, -BIRD_HEIGHT / 2, BIRD_WIDTH, BIRD_HEIGHT)
        ctx.restore()
      }
    }

    const drawPipes = () => {
      if (gameDataRef.current.pipes) {
        gameDataRef.current.pipes.draw(ctx)
      }
    }

    const drawScore = () => {
      const scoreStr = score.toString()
      const numberWidth = 24
      const numberHeight = 36
      const totalWidth = scoreStr.length * numberWidth
      const startX = (CANVAS_WIDTH - totalWidth) / 2

      for (let i = 0; i < scoreStr.length; i++) {
        const digit = parseInt(scoreStr[i])
        const numberImage = images[`numbers${digit}`]
        if (numberImage instanceof HTMLImageElement) {
          ctx.drawImage(numberImage, startX + i * numberWidth, 20, numberWidth, numberHeight)
        }
      }
    }

    const drawGetReady = () => {
      if (images.getReady instanceof HTMLImageElement) {
        ctx.drawImage(images.getReady, CANVAS_WIDTH / 2 - 92, CANVAS_HEIGHT / 2 - 150)
      }
    }

    const drawGameOver = () => {
      if (images.gameOver instanceof HTMLImageElement) {
        ctx.drawImage(images.gameOver, CANVAS_WIDTH / 2 - 96, CANVAS_HEIGHT / 2 - 42)
      }
      if (images.restartButton instanceof HTMLImageElement) {
        ctx.drawImage(images.restartButton, CANVAS_WIDTH / 2 - 60, CANVAS_HEIGHT / 2 + 50, 120, 40)
      }
    }

    const drawWin = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = 'white'
      ctx.font = '30px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('You Won!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
      ctx.font = '20px Arial'
      ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
      if (images.restartButton instanceof HTMLImageElement) {
        ctx.drawImage(images.restartButton, CANVAS_WIDTH / 2 - 60, CANVAS_HEIGHT / 2 + 50, 120, 40)
      }
    }

    const gameLoop = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      drawBackground()
      drawPipes()
      drawBase()
      drawBird()

      if (gameState === 'PLAYING') {
        updateGame()
        drawScore()
      } else if (gameState === 'START') {
        drawGetReady()
      } else if (gameState === 'GAME_OVER') {
        drawGameOver()
        drawScore()
        if (score > highScore) {
          setHighScore(score)
        }
      } else if (gameState === 'WIN') {
        drawWin()
      }

      animationFrameId = requestAnimationFrame(gameLoop)
    }

    const handleInteraction = () => {
      if (gameState === 'START' || gameState === 'GAME_OVER' || gameState === 'WIN') {
        resetGame()
      } else if (gameState === 'PLAYING') {
        gameDataRef.current.bird.velocity = -JUMP_STRENGTH
      }
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        handleInteraction()
      }
    }

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (gameState === 'GAME_OVER' || gameState === 'WIN') {
        const buttonX = CANVAS_WIDTH / 2 - 60
        const buttonY = CANVAS_HEIGHT / 2 + 50
        const buttonWidth = 120
        const buttonHeight = 40

        if (
          x >= buttonX &&
          x <= buttonX + buttonWidth &&
          y >= buttonY &&
          y <= buttonY + buttonHeight
        ) {
          handleInteraction()
        }
      } else {
        handleInteraction()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    canvas.addEventListener('click', handleClick)
    loadImages()

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      canvas.removeEventListener('click', handleClick)
      cancelAnimationFrame(animationFrameId)
    }
  }, [gameState, score, highScore])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-sky-200 p-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-yellow-500 rounded-lg shadow-lg"
      />
      <div className="mt-4 text-xl font-bold">High Score: {highScore}</div>
    </div>
  )
}