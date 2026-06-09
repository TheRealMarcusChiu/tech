import { h } from "preact"

// Floating hamburger + backdrop that slides the left sidebar in/out on narrow
// screens. All positioning/visibility lives in custom.scss (gated to the mobile
// breakpoint and the html.left-open state); this only injects the markup + JS.
const script = `
function setupSidebarToggle() {
  const btn = document.querySelector(".left-sidebar-toggle")
  const backdrop = document.querySelector(".left-sidebar-backdrop")
  if (!btn) return
  const root = document.documentElement

  const close = () => {
    root.classList.remove("left-open")
    btn.setAttribute("aria-expanded", "false")
  }
  const toggle = () => {
    const open = root.classList.toggle("left-open")
    btn.setAttribute("aria-expanded", open ? "true" : "false")
  }
  const onKey = (e) => { if (e.key === "Escape") close() }
  // close when a link inside the left sidebar is followed
  const sidebar = document.querySelector(".sidebar.left")
  const onSidebarClick = (e) => { if (e.target.closest("a")) close() }

  btn.addEventListener("click", toggle)
  backdrop && backdrop.addEventListener("click", close)
  document.addEventListener("keydown", onKey)
  sidebar && sidebar.addEventListener("click", onSidebarClick)

  // Quartz reuses DOM across SPA navigations; tear down so listeners don't stack.
  window.addCleanup && window.addCleanup(() => {
    btn.removeEventListener("click", toggle)
    backdrop && backdrop.removeEventListener("click", close)
    document.removeEventListener("keydown", onKey)
    sidebar && sidebar.removeEventListener("click", onSidebarClick)
    close()
  })
}
document.addEventListener("nav", setupSidebarToggle)
document.addEventListener("render", setupSidebarToggle)
`

const SidebarToggle = (_opts) => {
  function SidebarToggleComponent({ displayClass }) {
    const classes = [displayClass, "left-sidebar-controls"].filter(Boolean).join(" ")
    return h("div", { class: classes }, [
      h(
        "button",
        {
          class: "left-sidebar-toggle",
          "aria-label": "Toggle menu",
          "aria-expanded": "false",
        },
        h(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            width: "24",
            height: "24",
            fill: "none",
            stroke: "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
          },
          [
            h("line", { x1: "3", y1: "6", x2: "21", y2: "6" }),
            h("line", { x1: "3", y1: "12", x2: "21", y2: "12" }),
            h("line", { x1: "3", y1: "18", x2: "21", y2: "18" }),
          ],
        ),
      ),
      h("div", { class: "left-sidebar-backdrop" }),
    ])
  }
  SidebarToggleComponent.afterDOMLoaded = script
  return SidebarToggleComponent
}

export { SidebarToggle }
