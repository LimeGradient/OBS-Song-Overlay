import express, { type Request, type Response } from "express"
import * as cheerio from "cheerio"
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { SMTCMonitor } from "@coooookies/windows-smtc-monitor";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TrackMetadata {
    title: string,
    album: string,
    artist: string,
    image: string,
}

interface ProgressPayload {
    progress: number
}

export default class OBSServer {
    private port: number = 2876
    private app: express.Express = express()
    private clients: Response[] = []

    constructor() {    
        this.app.get("/", async (req, res) => {
            res.sendFile(path.join(__dirname, "index.html"))
        })

        this.app.get("/currentTrack", (req, res) => {
            const session = SMTCMonitor.getCurrentMediaSession()
            if (session) {
                const base64Image = Buffer.from(session.media.thumbnail?.buffer as ArrayBufferLike).toString('base64');
                const imageDataUrl = `data:image/png;base64,${base64Image}`;
                const timelinePos = Math.round((session.timeline.position / session.timeline.duration) * 10000) / 100

                res.json({
                    title: session.media.title,
                    album: session.media.albumTitle,
                    artist: session.media.artist,
                    image: imageDataUrl,
                    progress: timelinePos
                })
            } else {
                res.status(204).end()
            }
        })

        this.app.get('/events', (req: Request, res: Response): void => {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            this.clients.push(res);

            req.on('close', (): void => {
                this.clients = this.clients.filter(client => client !== res);
            });
        });

        this.app.listen(this.port, () => console.log(`Server started on port ${this.port}`))
    }

    updateTrack(title: string, album: string, artist: string, cover: Buffer) {
        const base64Image = cover.toString('base64');
        const imageDataUrl = `data:image/png;base64,${base64Image}`;

        const payload: TrackMetadata = {
            title,
            album,
            artist,
            image: imageDataUrl
        };

        this.clients.forEach((client: Response) => {
            client.write(`event: trackChange\ndata: ${JSON.stringify(payload)}\n\n`);
        });
    }

    updatePlayhead(progress: number) {
        const payload: ProgressPayload = {
            progress
        }

        this.clients.forEach((client: Response) => {
            client.write(`event: progress\ndata: ${JSON.stringify(payload)}\n\n`);
        });
    }
}