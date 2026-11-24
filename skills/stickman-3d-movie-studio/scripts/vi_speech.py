"""vi_speech — chuyển công thức toán sang lời đọc tiếng Việt chuẩn để máy đọc đúng.

Quy ước kịch bản: phần toán đặt trong $...$, ví dụ "Ta có $d = 2R$" → "Ta có đê bằng hai e-rờ".
Phần hiển thị (phụ đề) giữ kí hiệu: "Ta có d = 2R".
"""
import re

LETTER = {
    "a": "a", "b": "bê", "c": "xê", "d": "đê", "e": "e", "f": "ép", "g": "giê", "h": "hát", "i": "i", "j": "gi",
    "k": "ca", "l": "e-lờ", "m": "em-mờ", "n": "en-nờ", "o": "o", "p": "pê", "q": "quy", "r": "e-rờ", "s": "ét-xì",
    "t": "tê", "u": "u", "v": "vê", "w": "vê kép", "x": "ích", "y": "i dài", "z": "dét",
}
DIGITS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]


def read_int(n):
    n = int(n)
    if n < 0:
        return "âm " + read_int(-n)
    if n < 10:
        return DIGITS[n]
    if n < 100:
        t, u = divmod(n, 10)
        s = ("mười" if t == 1 else DIGITS[t] + " mươi")
        if u == 0:
            return s
        if u == 1 and t > 1:
            return s + " mốt"
        if u == 5:
            return s + " lăm"
        if u == 4 and t > 1:
            return s + " tư"
        return s + " " + DIGITS[u]
    if n < 1000:
        h, r = divmod(n, 100)
        s = DIGITS[h] + " trăm"
        if r == 0:
            return s
        if r < 10:
            return s + " lẻ " + DIGITS[r]
        return s + " " + read_int(r)
    for unit, name in ((10 ** 9, "tỉ"), (10 ** 6, "triệu"), (1000, "nghìn")):
        if n >= unit:
            q, r = divmod(n, unit)
            s = read_int(q) + " " + name
            if r == 0:
                return s
            if r < 100:
                return s + " không trăm " + (("lẻ " + DIGITS[r]) if r < 10 else read_int(r))
            return s + " " + read_int(r)
    return str(n)


def read_number(tok):
    tok = tok.replace(".", ",")
    if "," in tok:
        a, b = tok.split(",", 1)
        return read_int(a or 0) + " phẩy " + " ".join(DIGITS[int(c)] for c in b) if len(b) > 2 else read_int(a or 0) + " phẩy " + read_int(b)
    return read_int(tok)


SYMBOLS = [
    (r"\\sqrt\{([^}]*)\}", lambda m: "căn bậc hai của " + math_to_speech(m.group(1))),
    (r"\\frac\{([^}]*)\}\{([^}]*)\}", lambda m: math_to_speech(m.group(1)) + " phần " + math_to_speech(m.group(2))),
    (r"\\hat\{([A-Za-z]+)\}", lambda m: "góc " + " ".join(LETTER.get(c.lower(), c) for c in m.group(1))),
    (r"\\widehat\{([A-Za-z]+)\}", lambda m: "góc " + " ".join(LETTER.get(c.lower(), c) for c in m.group(1))),
    (r"\^\{?2\}?", " bình phương"), (r"\^\{?3\}?", " lập phương"), (r"\^\{?([0-9a-z]+)\}?", lambda m: " mũ " + math_to_speech(m.group(1))),
    (r"≤|\\le(q)?", " nhỏ hơn hoặc bằng "), (r"≥|\\ge(q)?", " lớn hơn hoặc bằng "), (r"≠|\\ne(q)?", " khác "),
    (r"≈|\\approx", " xấp xỉ "), (r"=", " bằng "), (r"<", " nhỏ hơn "), (r">", " lớn hơn "),
    (r"\+", " cộng "), (r"−|(?<=[\s\w)])-(?=[\s\w(])", " trừ "), (r"×|\\times|\\cdot|·", " nhân "), (r":|÷|\\div", " chia "),
    (r"π|\\pi", " pi "), (r"∠", " góc "), (r"°|\\circ", " độ "), (r"⊥|\\perp", " vuông góc với "), (r"//|∥|\\parallel", " song song với "),
    (r"%", " phần trăm "), (r"Δ|\\triangle", " tam giác "), (r"\(", " "), (r"\)", " "),
]


def math_to_speech(expr):
    s = expr
    for pat, rep in SYMBOLS:
        s = re.sub(pat, rep, s)
    out = []
    for tok in re.findall(r"\d+(?:[.,]\d+)?|[A-Za-zÀ-ỹ]+|\S", s):
        if re.fullmatch(r"\d+(?:[.,]\d+)?", tok):
            out.append(read_number(tok))
        elif re.fullmatch(r"[A-Za-z]+", tok) and len(tok) <= 3 and tok not in ("pi",):
            # tên điểm / biến: đọc từng chữ cái; hệ số đứng trước chữ: 2R → hai e-rờ
            out.append(" ".join(LETTER.get(c.lower(), c) for c in tok))
        else:
            out.append(tok)
    return re.sub(r"\s+", " ", " ".join(out)).strip()


def to_speech(text):
    """Câu kịch bản → (lời đọc, chữ hiển thị)."""
    spoken = re.sub(r"\$([^$]+)\$", lambda m: math_to_speech(m.group(1)), text)
    shown = re.sub(r"\$([^$]+)\$", lambda m: pretty(m.group(1)), text)
    return re.sub(r"\s+", " ", spoken).strip(), re.sub(r"\s+", " ", shown).strip()


def pretty(expr):
    s = expr.replace("\\cdot", "·").replace("\\times", "×").replace("\\pi", "π").replace("\\le", "≤").replace("\\ge", "≥")
    s = re.sub(r"\^\{?2\}?", "²", s)
    s = re.sub(r"\^\{?3\}?", "³", s)
    s = re.sub(r"\\sqrt\{([^}]*)\}", r"√\1", s)
    s = re.sub(r"\\frac\{([^}]*)\}\{([^}]*)\}", r"\1/\2", s)
    s = re.sub(r"\\hat\{([A-Za-z]+)\}", lambda m: m.group(1) + "\u0302", s)
    return s


if __name__ == "__main__":
    for t in ["Ta có $d = 2R$.", "Diện tích $S = \\pi R^2$.", "$x^2 - 5x + 6 = 0$", "Góc $\\hat{A} = 60°$", "Số $1250$ và $3,14$"]:
        print(to_speech(t))
