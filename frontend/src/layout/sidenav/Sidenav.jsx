import NavList from "./components/NavList"

export default function Sidenav() {
  return (
    <nav className="w-[250px] h-dvh bg-red-500 px-4 ">
        <header>
            <h1>logo</h1>
        </header>
        <div>
            <NavList />
        </div>
    </nav>
  )
}
