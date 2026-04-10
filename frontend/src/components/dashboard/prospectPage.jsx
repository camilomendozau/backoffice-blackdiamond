import React, { useState, useContext, useEffect } from 'react';
import CopyToClipboardButton from "./components/clipCopy";
import { UserInfoContext } from "./navBar";
import { Rnd } from 'react-rnd';
import YouTubePreviewer from './components/youtubePreviewer'
import axios from 'axios';
import { useProspectPage } from '../../context/prospectPageContext';
import { THEMES,TEMPLATES,LAYOUTS } from '../../data/pageProspectStyles';

const ProspectPageConfig = () => {
    const {prospectPageUrl,setProspectPageUrl} = useProspectPage();
    const [seleccionTemplate, setSeleccionTemplate] = useState('classic'); 
    const [seleccionTheme, setSeleccionTheme] = useState('biogreen');
    const [seleccionLayout, setSeleccionLayout] = useState('default');
    const [savingProspectPageUrl, setSavingProspectPageUrl] = useState(false);
    const [saveSuccessProspectPageUrl, setSaveSuccessProspectPageUrl] = useState(false);
    const [prospectConfigPageInfo, setProspectConfigPageInfo] = useState(null);
    const {userInfo} = useContext(UserInfoContext);


    const temaSeleccionado = THEMES.find((t) => t.id === seleccionTheme);
    const templateSeleccionado = TEMPLATES.find((t) => t.id === seleccionTemplate);
    const layoutSeleccionado = LAYOUTS.find((l) => l.id === seleccionLayout);

    let urlActual = `http://localhost:4321/?${userInfo?"ir="+userInfo.code:''}&th=${temaSeleccionado?.id ?? 'biogreen'}&t=${templateSeleccionado?.id ?? 'classic'}&l=${layoutSeleccionado?.id ?? 'default'}`;


    const manageSelectionTheme = (id) => {
        setSeleccionTheme(id);
    };

    const manageSelectionTemplate = (id) => {
        setSeleccionTemplate(id);
    };

    const manageSelectionLayout = (id) => {
        setSeleccionLayout(id);
    }

  const handleSaveProspectPageUrl = async () => {
    setSavingProspectPageUrl(true);
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${localStorage.getItem("access")}`,
          Accept: "application/json",
        },
    };
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/dashboard/prospect-page-config/`,
        { url: urlActual },
        config
      );
      setSaveSuccessProspectPageUrl(true);
      setProspectPageUrl(urlActual);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProspectPageUrl(false);
    }
};

useEffect(() => {
  if (!prospectPageUrl) return;
  
  const th = prospectPageUrl.split('&th=')[1]?.split('&')[0];
  const t  = prospectPageUrl.split('&t=')[1]?.split('&')[0];
  const l  = prospectPageUrl.split('&l=')[1]?.split('&')[0];

  if (th) setSeleccionTheme(th);
  if (t)  setSeleccionTemplate(t);
  if (l)  setSeleccionLayout(l);
}, [prospectPageUrl]);

    useEffect(() => {
        try {
          axios.get(`${process.env.REACT_APP_API_URL}/dashboard/prospect-page-config/${userInfo.code}`)
          .then(res => {
              setProspectConfigPageInfo(res.data)
          })      
        } catch (err) {
          console.error("Error al obtener informacion:",err);
        }
    },[setProspectConfigPageInfo,userInfo])

    if (!prospectConfigPageInfo) {
      return (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary me-2" role="status" />
          <span>Cargando configuración...</span>
        </div>
      );
    }
    
    return (
      <section style={{position:'relative'}}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
          Configuracion de Página de Prospecto
        </h2>
          <Rnd
            style={{zIndex:100}}
          >
            <div className='card' style={styles.resultadoContainer}>
            <div style={{display:'flex', textAlign:'center', padding:5}}>
              <h6 style={{backgroundColor: '#e7f3ff',color: '#0056b3', borderStartStartRadius:'10px', borderTopRightRadius:'10px', padding:5}}>Link de tu pagina de prospecto:</h6>
            </div>
              {(layoutSeleccionado || templateSeleccionado || temaSeleccionado) ? (
                  <div style={styles.resultado}>
                    <code style={{padding:10}}>
                      {urlActual}
                    </code>
                    <div style={{display:'flex',flexDirection:'column', backgroundColor: '#e7f3ff'}}>
                      <div style={{display:'flex', justifyContent:'space-around',color: '#0056b3', borderBottomLeftRadius:'15px', borderBottomRightRadius:'15px', padding:5}}>
                        <div style={styles.actionContainer}>
                          <CopyToClipboardButton text={urlActual} />
                          <small style={{fontSize:'0.7rem'}}>Copiar Link</small>
                        </div>
                        <a style={{...styles.actionContainer, textDecoration:'none'}} href={urlActual} target="_blank" rel="noopener noreferrer">
                          <i class="fa-solid fa-arrow-up-right-from-square fs-6"></i>
                          <small style={{fontSize:'0.7rem', marginTop:5}}>Previsualizar</small>
                        </a>
                      </div>
                      <button
                          className="btn btn-success btn-lg"
                          onClick={handleSaveProspectPageUrl}
                          disabled={savingProspectPageUrl || saveSuccessProspectPageUrl}
                        >
                          {savingProspectPageUrl ? (
                            <><span className="spinner-border spinner-border-sm me-1" role="status" />Guardando Link...</>
                          ) : saveSuccessProspectPageUrl ? "Link Guardado ✓" : "Guardar Link"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.resultado}>
                    <strong>{process.env.PROSPECT_PAGE_BASE_URL}</strong>
                  </div>
                )
              }        
            </div>
          </Rnd>
          
        <div className="mt-3">          
            <div className='card'>
                <h5 style={{ textAlign: 'center', margin: '20px' }}>
                    Selecciona un color para tu página de prospecto.
                </h5>
                <p style={{ textAlign: 'center', marginBottom: '20px' }}>
                    Estos colores iran tanto en los botones, la letra y los bordes.
                </p>
                <div style={styles.contenedorPrincipal}>
                {/* 3. Contenedor de las tarjetas */}
                <div style={styles.opcionesColoresGrid}>
                    {THEMES.map((opcion) => {
                    // Comprobamos si esta tarjeta es la seleccionada
                    const esSeleccionado = seleccionTheme === opcion.id;

                    return (
                        <div
                          key={opcion.id}
                          onClick={() => manageSelectionTheme(opcion.id)}
                          style={{
                              ...styles.tarjeta,
                              border: esSeleccionado ? '3px solid #007BFF' : '3px solid transparent',
                              transform: esSeleccionado ? 'scale(1.05)' : 'scale(1)',
                              boxShadow: esSeleccionado ? '0 4px 15px rgba(0, 123, 255, 0.4)' : '0 2px 5px rgba(0,0,0,0.1)'
                          }}
                          >
                          {/* <img 
                              src={opcion.imagenUrl} 
                              alt={opcion.titulo} 
                              style={styles.imagen} 
                          /> */}
                          <div style={{...styles.contenidoTarjetaThemes, background: opcion.colorGradient}} >
                          </div>
                          <div style={styles.contenidoTarjeta}>
                              <h3 style={{ margin: '0 0 5px 0' }}>{opcion.titulo}</h3>
                              {/* <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
                              {opcion.descripcion}
                              </p> */}
                          </div>
                        </div>
                    );
                    })}
                </div>               
                </div>
            </div>
        </div>
        <div className="mt-3">
            <div className='card'>
                <h5 style={{ textAlign: 'center', margin: '20px' }}>
                    Selecciona un diseño de los elementos para tu página de prospecto.
                </h5>
                <p style={{ textAlign: 'center', marginBottom: '20px' }}>
                    El diseño de la forma de los botones, el tipo de letra y el tamaño seran modificados.
                </p>
                <div style={styles.contenedorPrincipal}>
                {/* 3. Contenedor de las tarjetas */}
                <div style={styles.opcionesTemplateGrid}>
                    {TEMPLATES.map((opcion) => {
                    // Comprobamos si esta tarjeta es la seleccionada
                    const esSeleccionado = seleccionTemplate === opcion.id;
                    return (
                        <div
                        key={opcion.id}
                        onClick={() => manageSelectionTemplate(opcion.id)}
                        style={{
                            ...styles.tarjeta,
                            border: esSeleccionado ? '3px solid #007BFF' : '3px solid transparent',
                            transform: esSeleccionado ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: esSeleccionado ? '0 4px 15px rgba(0, 123, 255, 0.4)' : '0 2px 5px rgba(0,0,0,0.1)'
                        }}
                        >
                        <img 
                            src={opcion.imagenUrl} 
                            alt={opcion.titulo} 
                            style={styles.imagen} 
                        />
                        <div style={styles.contenidoTarjeta}>
                            <h3 style={{ margin: '0 0 5px 0' }}>{opcion.titulo}</h3>
                            <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
                            {opcion.descripcion}
                            </p>
                        </div>
                        </div>
                    );
                    })}
                </div>
                </div>
            </div>
        </div>
        <div className="mt-3">
            <div className='card'>
                <h5 style={{ textAlign: 'center', margin: '20px' }}>
                    Selecciona el posicionamiento de los elementos de tu página de prospecto.
                </h5>
                <p style={{ textAlign: 'center', marginBottom: '20px' }}>
                    Los elementos como el video, los botones y llamada a accion se modificaran (solo en pantalla grande).
                </p>
                <div style={styles.contenedorPrincipal}>
                <div style={styles.opcionesTemplateGrid}>
                    {LAYOUTS.map((opcion) => {
                    // Comprobamos si esta tarjeta es la seleccionada
                    const esSeleccionado = seleccionLayout === opcion.id;
                    return (
                        <div
                        key={opcion.id}
                        onClick={() => manageSelectionLayout(opcion.id)}
                        style={{
                            ...styles.tarjeta,
                            border: esSeleccionado ? '3px solid #007BFF' : '3px solid transparent',
                            transform: esSeleccionado ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: esSeleccionado ? '0 4px 15px rgba(0, 123, 255, 0.4)' : '0 2px 5px rgba(0,0,0,0.1)'
                        }}
                        >
                        <img 
                            src={opcion.imagenUrl} 
                            alt={opcion.titulo} 
                            style={styles.imagen} 
                        />
                        <div style={styles.contenidoTarjeta}>
                            <h3 style={{ margin: '0 0 5px 0' }}>{opcion.titulo}</h3>
                            <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
                            {opcion.descripcion}
                            </p>
                        </div>
                        </div>
                    );
                    })}
                </div>
                </div>
            </div>
        </div>
        <div className="mt-3">
          <div className='card'>
                <h5 style={{ textAlign: 'center', margin: '20px' }}>
                    Carga el enlace del Video de YOUTUBE para la pagina de INICIO.
                </h5>
                <p style={{ textAlign: 'center', margin: '10px' }}>
                    Solo el enlace del video de youtube sera aceptado, el video se mostrara al abrir la pagina. El video se adaptara a pantallas grandes y pequeñas.
                </p>
                <div className='w-75 mx-auto mb-5'>
                    <YouTubePreviewer
                      className="m-4"
                      defaultUrl={prospectConfigPageInfo.initial_video_url??"https://youtu.be/vwgtVqjh1yQ?si=eJKFTCx9Lmupqtef"}
                      maxDuration={180}
                      keyToPayload={"initial_video_url"}
                      saveUrl={"/dashboard/prospect-page-config/"}
                      onVideoLoad={(id, title, duration) => console.log(duration)}
                    />
                </div>
          </div>
        </div>
        <div className="mt-3">
          <div className='card'>
                <h5 style={{ textAlign: 'center', margin: '20px' }}>
                    Carga el enlace del Video de YOUTUBE para la pagina de PRESENTACION DEL NEGOCIO.
                </h5>
                <p style={{ textAlign: 'center', margin: '10px' }}>
                    Solo el enlace del video de youtube sera aceptado, el video se mostrara al abrir la pagina. El video se adaptara a pantallas grandes y pequeñas.
                </p>
                <div className='w-75 mx-auto mb-5'>
                    <YouTubePreviewer
                      className="m-4"
                      defaultUrl={prospectConfigPageInfo.presentation_video_url??"https://youtube.com/watch?v=dQw4w9WgXcQ"}
                      maxDuration={900}
                      keyToPayload={"presentation_video_url"}
                      saveUrl={"/dashboard/prospect-page-config/"}
                      onVideoLoad={(id, title, duration) => console.log(duration)}
                    />
                </div>
          </div>
        </div>
        <div className="mt-3">
          <div className='card'>
                <h5 style={{ textAlign: 'center', margin: '20px' }}>
                    Carga el enlace del Video de YOUTUBE para la pagina de CATALOGO DE PRODUCTO.
                </h5>
                <p style={{ textAlign: 'center', margin: '10px' }}>
                    Solo el enlace del video de youtube sera aceptado, el video se mostrara al abrir la pagina. El video se adaptara a pantallas grandes y pequeñas.
                </p>
                <div className='w-75 mx-auto mb-5'>
                    <YouTubePreviewer
                      className="m-4"
                      defaultUrl={prospectConfigPageInfo.catalog_video_url??"https://youtu.be/E1tnA8oeqyY?si=denu6VECfRRPWxem"}
                      maxDuration={2400}
                      keyToPayload={"catalog_video_url"}
                      saveUrl={"/dashboard/prospect-page-config/"}
                      onVideoLoad={(id, title, duration) => console.log(duration)}
                    />
                </div>
          </div>
        </div>
        <div className="mt-3">
          <div className='card'>
                <h5 style={{ textAlign: 'center', margin: '20px' }}>
                    Carga el enlace del Video de YOUTUBE para la pagina de ¿POR QUE BIOLIFFE?
                </h5>
                <p style={{ textAlign: 'center', margin: '10px' }}>
                    Solo el enlace del video de youtube sera aceptado, el video se mostrara al abrir la pagina. El video se adaptara a pantallas grandes y pequeñas.
                </p>
                <div className='w-75 mx-auto mb-5'>
                    <YouTubePreviewer
                      className="m-4"
                      defaultUrl={prospectConfigPageInfo.why_bioliffe_video_url??"https://youtu.be/pEwOuenPqAU?si=zScJYT8OzoCio4lX"}
                      maxDuration={180}
                      keyToPayload={"why_bioliffe_video_url"}
                      saveUrl={"/dashboard/prospect-page-config/"}
                      onVideoLoad={(id, title, duration) => console.log(duration)}
                    />
                </div>
          </div>
        </div>
      </section>
    );
}

export default ProspectPageConfig;

const styles = {
  contenedorPrincipal: {
    fontFamily: 'sans-serif',
    maxWidth: '1500px', // Ampliamos el contenedor principal
    margin: '0 auto',
    padding: '20px'
  },
  opcionesColoresGrid:{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr', // <-- AQUÍ: Define exactamente 2 columnas iguales
    gap: '30px',
  },
  opcionesTemplateGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr', // <-- AQUÍ: Define exactamente 2 columnas iguales
    gap: '30px', // Espacio entre las tarjetas
  },
  tarjeta: {
    cursor: 'pointer',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#fff',
    transition: 'all 0.3s ease',
    // Eliminamos el width fijo para que se adapte al ancho de la columna
  },
  imagen: {
    width: '100%',
    height: '280px', // <-- Aumentamos la altura de la imagen
    objectFit: 'cover',
    display: 'block'
  },
  contenidoTarjeta: {
    padding: '20px',
    textAlign: 'center'
  },
  contenidoTarjetaThemes:{
    height: '100px',
  },
  resultado: {
    textAlign: 'center',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    fontSize: '18px'
  },
  resultadoContainer:{
    position:'fixed',
    top:'40%',
    right:15, 
    width:200, 
    height:'auto',  
    display:'flex', 
    flexDirection:'column', 
    justifyContent:'center', 
    alignItems:'center',
    border:'3px solid #007BFF'
  },
  actionContainer:{
    display:'flex',
    flexDirection:'column',
    alignItems:'center',
    justifyContent:'center',
    width:'auto',
    padding:10,
    borderRadius:'15px',
    backgroundColor: '#e7f3',
  }
};