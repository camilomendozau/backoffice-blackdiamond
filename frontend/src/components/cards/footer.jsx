import { Link } from "react-router-dom";
import { useContext } from "react";
import { ServiceContext } from "../../App";
import { CompanyInformationContext } from "../../App";
import TextTruncate from 'react-text-truncate';


const Footer = () => {
    const ServiceList = useContext(ServiceContext)
    const companyInfo = useContext(CompanyInformationContext)
    const year = new Date()

    return (
        <div className="bg-primary text-white pb-2">
            <div className="container">
                <div className="row gy-3">

                    {companyInfo.about_company
                        ?
                        <div className="col-lg">
                            <h4 className="h4 text-white">Sobre Nosotros</h4>
                            <TextTruncate
                                line={6}
                                element="p"
                                truncateText="…"
                                text={companyInfo.safe_about_body_html}
                            />
                        </div>
                        :
                        null
                    }


                    {Object.keys(ServiceList).length === 0
                        ?
                        null
                        :
                        <div className="col-lg">
                            <h4 className="h4 text-white">Servicios</h4>
                            <ul className="list-group list-group-flush">
                                {ServiceList.map(item =>
                                    <li key={item.id}><Link to='#' class="list-group-item bg-primary text-white"><i
                                        className="fa-solid fa-angles-right me-1"></i>{item.title}</Link></li>
                                )}

                            </ul>
                        </div>
                    }


                    <div className="col-lg">
                        <h4 className="h4 text-white">Links Rapidos</h4>
                        <ul className="list-group list-group-flush">
                            <li><Link to='/terms-and-conditions' className="list-group-item bg-primary text-white"><i
                                className="fa-solid fa-angles-right me-1"></i>Terminos y Condiciones</Link></li>
                            <li><Link to='/privacy-policy' className="list-group-item bg-primary text-white"><i
                                class="fa-solid fa-angles-right me-1"></i>Politicas de Privacidad</Link></li>
                            <li><Link to='/contact' className="list-group-item bg-primary text-white"><i
                                className="fa-solid fa-angles-right me-1"></i>Contactanos</Link></li>
                            <li><Link to='/about' className="list-group-item bg-primary text-white"><i
                                className="fa-solid fa-angles-right me-1"></i>Sobre Nosotros</Link></li>
                        </ul>
                    </div>
                    <section className="col-lg">
                        <h4 className="h4 text-white">Marketing Multinivel</h4>
                        <ul className="list-group list-group-flush">
                            <li><Link to='/mlm-marketing' className="list-group-item bg-primary text-white"><i
                                className="fa-solid fa-angles-right me-1"></i>Como funciona</Link></li>
                            <li><Link to='/signup' className="list-group-item bg-primary text-white"><i
                                className="fa-solid fa-angles-right me-1"></i>Crear Cuenta</Link></li>
                            <li><Link to='/login' className="list-group-item bg-primary text-white"><i
                                className="fa-solid fa-angles-right me-1"></i>Iniciar Sesion</Link></li>
                        </ul>
                    </section>

                </div>
                <section className="row">
                    <hr className="mt-2 bg-white" style={{ height: 1 }} />
                    <div class="hstack mb-2 justify-content-center">

                        {companyInfo.facebook_url
                            ?
                            <div class="me-1 bg-white p-1"><Link to={companyInfo.facebook_url} target="_blank"><i className="fa-brands fa-square-facebook fs-5 text-primary align-middle"></i></Link></div>
                            :
                            null
                        }

                        {companyInfo.instagram_url
                            ?
                            <div class="me-1 bg-white p-1"><Link to={companyInfo.instagram_url} target="_blank"><i className="fa-brands fa-instagram fs-5 text-primary align-middle"></i></Link></div>
                            :
                            null
                        }

                        {companyInfo.twitter_url
                            ?
                            <div class="me-1 bg-white p-1"><Link to={companyInfo.twitter_url} target="_blank"><i className="fa-brands fa-square-twitter fs-5 text-primary align-middle"></i></Link></div>
                            :
                            null
                        }

                        {companyInfo.linkedin_url
                            ?
                            <div class="me-1 bg-white p-1"><Link to={companyInfo.linkedin_url} target="_blank"><i className="fa-brands fa-linkedin fs-5 text-primary align-middle"></i></Link></div>
                            :
                            null
                        }

                        {companyInfo.youtube_url
                            ?
                            <div class="me-1 bg-white p-1"><Link to={companyInfo.youtube_url} target="_blank"><i className="fa-brands fa-square-youtube fs-5 text-primary align-middle"></i></Link></div>
                            :
                            null
                        }

                        {companyInfo.whatsapp_url
                            ?
                            <div class="me-1 bg-white p-1"><Link to={companyInfo.whatsapp_url} target="_blank"><i className="fa-brands fa-whatsapp fs-5 text-primary align-middle"></i></Link></div>
                            :
                            null
                        }
                    </div>



                    <small className="text-center">&#169; {companyInfo.company_name} {year.getFullYear()}. Todos los derechos reservados</small>
                    <small className="text-center">Diseñado y Desarrollado por <a href="https://linktr.ee/winaytech" target="_blank"
                        className="text-decoration-none text-white fw-bold"
                    >Winay Tech</a></small>
                </section>
            </div>
        </div>
    );
}

export default Footer;