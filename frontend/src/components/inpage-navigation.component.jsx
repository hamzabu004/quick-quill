import { useState, useRef, useEffect } from "react";

export let activeTabLineRef;
export let activeTabRef;

const InPageNavigation = ({ routes, defaultHidden=[], defaultActiveIndex = 0, children}) => {

    activeTabLineRef = useRef()
    activeTabRef = useRef()
    
    let [resizeEvent, setResizeEvent] = useState(false);

    let [ inPageNavIndex, setinPageNavIndex ] = useState(null);

    let [width, setWidth ] = useState(window.innerWidth)

    const changePageState = (btn, i) => {

        let { offsetWidth, offsetLeft } = btn;

        activeTabLineRef.current.style.width = offsetWidth+"px";
        activeTabLineRef.current.style.left = offsetLeft+"px";

        setinPageNavIndex(i)


    }

    useEffect(()=> {
        if(inPageNavIndex != defaultActiveIndex){
            changePageState(activeTabRef.current, defaultActiveIndex)
        }
        
        if(!resizeEvent) {
            window.addEventListener('resize', () => {
                if(!resizeEvent){
                    setResizeEvent(true);
                }
                setWidth(window.innerWidth);
            })
        }

    }, [width])

    return (
        <>
            <div className="relative mb-8 bg-white flex flex-nowrap overflow-x-auto">

                {
                    routes.map((route, i) => {
                        return (
                            <button ref={i==defaultActiveIndex ? activeTabRef : null}
                            key={i} 
                            className={"p-4 px-5 capitalize " + ( inPageNavIndex == i ? "text-black" : "text-dark-grey ") + (defaultHidden.includes(route)?"md:hidden":"")}
                            onClick={(e) => {changePageState(e.target, i)}}>
                                {route}
                            </button>
                        )
                    })
                }
                <hr ref={activeTabLineRef} className="absolute bottom-0 border-purple/100 duration-150"></hr>

            </div>
            
            {Array.isArray(children)?children[inPageNavIndex]:children}
        </>
    )
}

export default InPageNavigation