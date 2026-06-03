import { describe, it, expect, expectTypeOf, vi, beforeEach, afterEach } from "vitest";
import { SUPPORTED_FONTS, loadFont, type FontDefinition } from "@/lib/utils/fontUtils";
import { strictMock } from "@test/utils/strictObject";

describe("Font Utilities", () => {
    describe("SUPPORTED_FONTS", () => {
        it("is an array", () => {
            expect(Array.isArray(SUPPORTED_FONTS)).toBe(true);
        });

        it("has correct type structure", () => {
            expectTypeOf(SUPPORTED_FONTS).toEqualTypeOf<FontDefinition[]>();
        });

        it("contains system fonts", () => {
            const systemFonts = SUPPORTED_FONTS.filter((f) => f.type === "system");
            expect(systemFonts.length).toBeGreaterThan(0);
            expect(systemFonts.some((f) => f.value === "system-ui")).toBe(true);
            expect(systemFonts.some((f) => f.value === "monospace")).toBe(true);
            expect(systemFonts.some((f) => f.value === "serif")).toBe(true);
            expect(systemFonts.some((f) => f.value === "sans-serif")).toBe(true);
        });

        it("contains Google fonts", () => {
            const googleFonts = SUPPORTED_FONTS.filter((f) => f.type === "google");
            expect(googleFonts.length).toBeGreaterThan(0);
            expect(googleFonts.some((f) => f.value === "Noto Sans KR")).toBe(true);
            expect(googleFonts.some((f) => f.value === "Roboto")).toBe(true);
            expect(googleFonts.some((f) => f.value === "Open Sans")).toBe(true);
            expect(googleFonts.some((f) => f.value === "Lato")).toBe(true);
            expect(googleFonts.some((f) => f.value === "Montserrat")).toBe(true);
            expect(googleFonts.some((f) => f.value === "Poppins")).toBe(true);
        });

        it("each font has name, value, and type", () => {
            for (const font of SUPPORTED_FONTS) {
                expect(font).toHaveProperty("name");
                expect(font).toHaveProperty("value");
                expect(font).toHaveProperty("type");
                expect(typeof font.name).toBe("string");
                expect(typeof font.value).toBe("string");
                expect(["system", "google"]).toContain(font.type);
            }
        });
    });

    describe("loadFont", () => {
        const mockHead = {
            appendChild: vi.fn(),
        };
        // Use a standalone mock function to avoid the deprecated createElement type
        const mockCreateElement = vi.fn<() => { id: string; rel: string; href: string }>(() => ({
            id: "",
            rel: "",
            href: "",
        }));
        const mockElements: Map<string, { id: string }> = new Map();

        beforeEach(() => {
            mockCreateElement.mockClear();
            vi.stubGlobal("document", {
                head: mockHead,
                getElementById: vi.fn((id: string) => mockElements.get(id) ?? null),
                createElement: mockCreateElement,
            });
            mockHead.appendChild.mockClear();
            mockElements.clear();
        });

        afterEach(() => {
            vi.unstubAllGlobals();
        });

        it("does nothing for system fonts", () => {
            loadFont("system-ui");
            expect(mockCreateElement.mock.calls).toHaveLength(0);
        });

        it("does nothing for unsupported fonts", () => {
            loadFont("Unknown Font");
            expect(mockCreateElement.mock.calls).toHaveLength(0);
        });

        it("creates a link element for Google fonts", () => {
            loadFont("Roboto");
            expect(mockCreateElement).toHaveBeenCalledWith("link");
        });

        it("sets correct attributes on the link element", () => {
            const mockLink = { id: "", rel: "", href: "" };
            mockCreateElement.mockReturnValue(mockLink);

            loadFont("Roboto");

            expect(mockLink.id).toBe("font-roboto");
            expect(mockLink.rel).toBe("stylesheet");
            expect(mockLink.href).toContain("fonts.googleapis.com");
            expect(mockLink.href).toContain("family=Roboto");
        });

        it("generates correct font ID with hyphens", () => {
            const mockLink = { id: "", rel: "", href: "" };
            mockCreateElement.mockReturnValue(mockLink);

            loadFont("Noto Sans KR");

            expect(mockLink.id).toBe("font-noto-sans-kr");
        });

        it("generates correct href with plus signs for spaces", () => {
            const mockLink = { id: "", rel: "", href: "" };
            mockCreateElement.mockReturnValue(mockLink);

            loadFont("Open Sans");

            expect(mockLink.href).toContain("family=Open+Sans");
        });

        it("includes font weights in href", () => {
            const mockLink = { id: "", rel: "", href: "" };
            mockCreateElement.mockReturnValue(mockLink);

            loadFont("Poppins");

            expect(mockLink.href).toContain("wght@300;400;500;700");
        });

        it("appends the link to document.head", () => {
            const mockLink = strictMock<HTMLLinkElement>({ id: "", rel: "", href: "" });
            mockCreateElement.mockReturnValue(mockLink);

            loadFont("Roboto");

            expect(mockHead.appendChild).toHaveBeenCalledWith(mockLink);
        });

        it("does not load a font that is already loaded", () => {
            mockElements.set("font-roboto", { id: "font-roboto" });
            loadFont("Roboto");

            expect(mockCreateElement).not.toHaveBeenCalled();
        });
    });
});
