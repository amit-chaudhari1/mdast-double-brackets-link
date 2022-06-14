"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const unist_util_visit_1 = __importDefault(require("unist-util-visit"));
const slugify_1 = __importDefault(require("slugify"));
/**
 * if title is something like `folder1/folder2/name`,
 * will slugify the name, while keeping the folder names
 */
const defaultTitleToURLPath = (title) => {
    const segments = title.split("/");
    const slugifiedTitle = (0, slugify_1.default)(segments.pop());
    return `${segments.join("/")}/${slugifiedTitle}`;
};
const addDoubleBracketsLinks = ({ markdownAST }, options) => {
    const titleToURL = (options === null || options === void 0 ? void 0 : options.titleToURLPath)
        ? require(options.titleToURLPath)
        : defaultTitleToURLPath;
    const definitions = {};
    (0, unist_util_visit_1.default)(markdownAST, `definition`, (node) => {
        if (!node.identifier || typeof node.identifier !== "string") {
            return;
        }
        definitions[node.identifier] = true;
    });
    (0, unist_util_visit_1.default)(markdownAST, `linkReference`, (node, index, parent) => {
        if (node.referenceType !== "shortcut" ||
            (typeof node.identifier === "string" && definitions[node.identifier])) {
            return;
        }
        const siblings = parent === null || parent === void 0 ? void 0 : parent.children;
        if (!index || !siblings || !Array.isArray(siblings)) {
            return;
        }
        const previous = siblings[index - 1];
        const next = siblings[index + 1];
        if (!previous || !next) {
            return;
        }
        if (previous.type !== "text" ||
            !previous.value ||
            previous.value[previous.value.length - 1] !== "[" ||
            next.type !== "text" ||
            next.value[0] !== "]") {
            return;
        }
        previous.value = previous.value.replace(/\[$/, "");
        next.value = next.value.replace(/^\]/, "");
        let heading = "";
        if ((options === null || options === void 0 ? void 0 : options.parseWikiLinks) && Array.isArray(node.children)) {
            let label = node.label;
            if (label.match(/#/) && Array.isArray(node.children)) {
                // @ts-ignore
                [node.children[0].value, heading] = label.split("#");
                [heading] = heading.split("|");
                node.label = label.replace(`#${heading}`, "");
            }
            label = node.label;
            if (label.match(/\|/)) {
                // @ts-ignore
                [node.label, node.children[0].value] = label.split("|");
            }
        }
        if (!(options === null || options === void 0 ? void 0 : options.stripBrackets) && Array.isArray(node.children)) {
            // @ts-ignore
            node.children[0].value = `[[${node.children[0].value}]]`;
        }
        // @ts-ignore
        node.type = "link";
        // @ts-ignore
        node.url = `${titleToURL(node.label)}${heading
            ? `#${(0, slugify_1.default)(heading, {
                lower: true,
            })}`
            : ""}`;
        // @ts-ignore
        node.title = node.label;
        delete node.label;
        // @ts-ignore
        delete node.referenceType;
        // @ts-ignore
        delete node.identifier;
    });
};
exports.default = addDoubleBracketsLinks;
