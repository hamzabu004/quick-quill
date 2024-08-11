const NoDataMessage = ({message, secondary=''}) => {
    return (
        <div className="text-center w-full p-4 rounded-full bg-grey/50 mt-4 text-purple">
            <p>{message}</p>
            <p>{secondary.length ? secondary: ""}</p>
        </div>
    )
}

export default NoDataMessage