import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomePage.css';
import { AuthContext } from '../../components/security/AuthContext.js';

const WelcomePage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isAdmin, isLoading } = useContext(AuthContext);

    // Only redirect admins away from welcome page
    useEffect(() => {
        if (!isLoading && isAuthenticated && isAdmin) {
            navigate('/admin/dashboard');
        }
    }, [isLoading, isAuthenticated, isAdmin, navigate]);

    if (isLoading) {
        return null; // or a loading spinner
    }

    const handleLogin = () => {
        navigate('/login');
    };

    const handleSignUp = () => {
        navigate('/signup');
    };

    const handleGetStarted = () => {
        if (isAuthenticated) {
            if (isAdmin) {
                navigate('/admin/dashboard');
            } else {
                navigate('/collections');
            }
        } else {
            navigate('/login');
        }
    };

    return (
        <div className='welcome-page'>
            <div
                className="header-background-image"
                style={{
                    backgroundImage: `url('/images/mountains.png')`,
                }}>
                <div className="header-content">
                    <div className='row'>
                        <div className='cta-car'>
                            <img src={'/images/car.svg'} alt="Car Icon" className="car-svg" />
                            <h1 className="title-header">Automated Vehicles Fuel and Energy Estimation</h1>
                        </div>
                        <div className="sign-container-flex">
                            {isAuthenticated ? (
                                <div className='pole-align'>
                                    <div
                                        className="sign get-started"
                                        onClick={handleGetStarted}
                                        style={{ backgroundImage: `url('/images/diamond.svg')` }}
                                    >
                                        <div className="sign-text">Let's Go</div>
                                    </div>
                                    <div className="sign-pole"></div>
                                </div>
                            ) : (
                                <>
                                    <div className='pole-align'>
                                        <div
                                            className="sign signup"
                                            onClick={handleSignUp}
                                            style={{ backgroundImage: `url('/images/diamond.svg')` }}
                                        >
                                            <div className="sign-text">Sign Up</div>
                                        </div>
                                        <div className="sign-pole"></div>
                                    </div>
                                    <div className='pole-align'>
                                        <div
                                            className="sign login"
                                            onClick={handleLogin}
                                            style={{ backgroundImage: `url('/images/sheild.svg')` }}
                                        >
                                            <div className="sign-text">Login</div>
                                        </div>
                                        <div className="sign-pole"></div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="road-container">
                        <div className="road">
                            <div className="road-line"></div>
                        </div>
                    </div>
                </div>
            </div>

<section className="content">
    <h2 className="tool-header">Our Tool</h2>
    <p className="tool-intro">
        Welcome to the <span className="tool-highlight">Automated Vehicles Fuel/Energy Estimation Tool</span>. 
        Researchers at the <span className="tool-highlight">Virginia Tech Transportation Institute (VTTI)</span> have 
        developed innovative models that estimate the fuel and energy consumption of various vehicle types.
    </p>
    
    <ul className="vehicle-list">
        <li>ICEV (Internal Combustion Engine Vehicle)</li>
        <li>BEV (Battery Electric Vehicle)</li>
        <li>HEV (Hybrid Electric Vehicle)</li>
        <li>HFCV (Hydrogen Fuel Cell Vehicle)</li>
    </ul>
    
    <p className="tool-outro">
        Using these inputs, you will receive detailed visualizations of estimated  
        <span className="tool-highlight"> fuel or energy consumption</span> for each vehicle type.
    </p>
</section>

<section className="content">
    <h2>Why This Matters</h2>
    <p>
        Our tool is designed for anyone interested in understanding the 
        <span class="bold"> environmental impact</span> of different vehicles. Whether you're an 
        <span class="bold"> environmental advocate</span>, transportation researcher, or simply curious about greener transportation 
        options, this tool helps you analyze fuel and energy consumption across a range of vehicle types.
    </p>
    <p>
        By providing these insights, we aim to facilitate <span class="bold">informed decision-making</span> that could shape the 
        future of the transportation system in the U.S. and around the world.
    </p>
</section>

<section className="content">
    <h2 className="team-header">Our Team</h2>
    <p className="team-intro">
        This project was developed by students at <span className="bold">Virginia Tech</span> under 
        the guidance of <span className="bold">Dr. Mohamed Farag</span> in collaboration with 
        the <span className="bold">Virginia Tech Transportation Institute (VTTI)</span>.
    </p>
    
    <h3 className="team-subheader">Core Team</h3>
    <div className="team-grid">
        <div className="team-member">
            <h4>Katelyn Crumpacker</h4>
            <p>Design, Database & Team Leader</p>
        </div>
        <div className="team-member">
            <h4>Trevor White</h4>
            <p>Requirements & Backend</p>
        </div>
        <div className="team-member">
            <h4>David Rankin</h4>
            <p>Prototyping & Frontend</p>
        </div>
        <div className="team-member">
            <h4>Paladugu Harsha</h4>
            <p>v</p>
        </div>
    </div>
    
    <p className="team-outro">
        Each team member brought unique skills to create this tool, combining expertise in 
        frontend development, backend systems, and data management. This collaboration between 
        students, faculty, and VTTI researchers demonstrates how academic projects can create 
        practical tools for real-world challenges in transportation and environmental studies.
    </p>
</section>

        </div>
    );
};



export default WelcomePage;
