import { useState, useRef} from "react";
// import DownloaderButton from "./DownloaderButton";

export default function VideoPlayer({ src, name, onEndVideo }) {
    const [duration, setDuration] = useState(0);
    const [timeViewed, setTimeViewed] = useState(0);
    const playerRef = useRef(null);

    // const handleDurationYoutube = (event) => {
    //     let durationInSeconds = event.target.api.getDuration();
    //     setDuration(durationInSeconds);
    // };

    // const handleDuration = (event) => {
    //     console.log(event.target.duration);
    //     setDuration(event.target.duration);
    // };

    // const onStartPlayer = () => {
    //     //analytics.trackVideoStart(name);
    //     setHiddenControls(false);
    // };

    // const onPausedPlayer = (state) => {
    //     const percentagePlayed = duration > 0 
    //         ? Math.round((state.target.currentTime / duration) * 100) 
    //         : 0;
    //     analytics.trackVideoPause(name, percentagePlayed);
    // };

    // ← Modificar esta función para verificar antes de navegar
    // const onEndVideo = async () => {
    //     setHiddenControls(false);
    // };

    return (
        !src.includes("https") && !src.includes("youtube.com") ? (
            <div className="d-flex align-items-center justify-content-center flex-column flex-md-row m-2">
                <div className="ratio ratio-16x9 rounded shadow w-100" style={{ maxWidth: '80%' }}>                    <video
                        src={src}
                        ref={playerRef}
                        controls={true}
                        width={"100%"}
                        height={"100%"}
                        // onLoadedMetadata={handleDuration}
                        onEnded={onEndVideo}
                    />
                </div>
                {/* <DownloaderButton src={src} /> */}
            </div>
        ) : (
            <div className="w-full aspect-video rounded-2xl" style={{ outline: '40px solid transparent', boxShadow: '0 35px 60px -15px rgba(0,0,0,0.25)' }}>
                <iframe
                    src={src}
                    title={name}
                    width="100%"
                    height="100%"
                    onEnded={onEndVideo}
                    allowFullScreen
                />
            </div>
        )
    );
}