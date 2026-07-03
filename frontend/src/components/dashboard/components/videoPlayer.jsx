import {useRef} from "react";
// import DownloaderButton from "./DownloaderButton";

export default function VideoPlayer({ src, name, onEndVideo }) {
    // const [duration, setDuration] = useState(0);
    // const [timeViewed, setTimeViewed] = useState(0);
    const playerRef = useRef(null);

    // ✅ Detectar si es YouTube, no si tiene "https"
    const isYoutube = src.includes("youtube.com") || src.includes("youtu.be");

    return (
        !isYoutube ? (
            <div className="d-flex align-items-center justify-content-center flex-column flex-md-row m-2">
                <div className="ratio ratio-16x9 rounded shadow w-100" style={{ maxWidth: '80%' }}>
                    <video
                        src={src}
                        ref={playerRef}
                        controls={true}
                        width={"100%"}
                        height={"100%"}
                        onEnded={onEndVideo}
                    />
                </div>
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