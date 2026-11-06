import { SMTCMonitor, PlaybackStatus } from "@coooookies/windows-smtc-monitor"
import type { TimelineProps } from "@coooookies/windows-smtc-monitor"

import OBSServer from "./server.ts"

const smtc = new SMTCMonitor()
const server = new OBSServer()

smtc.on("session-media-changed", (appId, mediaProps) => {
    console.log(
        "session-media-changed",
        appId,
        mediaProps.title,
        mediaProps.thumbnail?.length
    )

    server.updateTrack(mediaProps.title, mediaProps.albumTitle, mediaProps.artist, Buffer.from(mediaProps.thumbnail?.buffer as ArrayBufferLike))
})

smtc.on("session-timeline-changed", (appId, timelineProps: TimelineProps) => {
    server.updatePlayhead(Math.round((timelineProps.position / timelineProps.duration) * 10000) / 100)

    console.log(
        "session-timeline-changed",
        appId,
        `${timelineProps.duration > 0
            ? Math.round(
                (timelineProps.position / timelineProps.duration) * 10000
            ) / 100
            : "-"
        }%`,
        timelineProps.position,
        timelineProps.duration
    )
})

smtc.on("session-playback-changed", (appId, playbackInfo) => {
    switch (playbackInfo.playbackStatus) {
        case PlaybackStatus.CHANGING:
            console.log("session-playback-changed", appId, "CHANGING")
            break
        case PlaybackStatus.CLOSED:
            console.log("session-playback-changed", appId, "CLOSED")
            break
        case PlaybackStatus.OPENED:
            console.log("session-playback-changed", appId, "OPENED")
            break
        case PlaybackStatus.STOPPED:
            console.log("session-playback-changed", appId, "STOPPED")
            break
        case PlaybackStatus.PLAYING:
            console.log("session-playback-changed", appId, "PLAYING")
            break
        case PlaybackStatus.PAUSED:
            console.log("session-playback-changed", appId, "PAUSED")
            break
    }
})

smtc.on("session-added", (appId, mediaInfo) => {
    console.log("session-added", appId, mediaInfo.lastUpdatedTime)
})

smtc.on("session-removed", (appId) => {
    console.log("session-removed", appId)
})

smtc.on("current-session-changed", (appId) => {
    console.log("current-session-changed", appId)
})