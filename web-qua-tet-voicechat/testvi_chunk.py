import re
def vietnamese_tokenizer(text, min_words=2):
    # Pattern to split by:
    # 1. Conjunctions preceded by comma: , và | , nhưng | ... (Priority to capture full conjunction)
    # 2. Safe Dot: . not inside numbers
    # 3. Standard terminators: ? ! ; : \n
    # 4. Safe Comma: , not inside numbers (Fallback)
    
    pattern = r'([,]\s*(?:và|nhưng|mà|thì|nên|để)\b|(?<!\d)[.]|[.](?!\d)|[?!;:\n]+|(?<!\d)[,]|[,](?!\d))'
    
    parts = re.split(pattern, text, flags=re.IGNORECASE)
    
    sentences = []
    current_sentence = ""
    
    for part in parts:
        if not part:
            continue
            
        # If it's a delimiter (matches the pattern)
        if re.match(pattern, part, re.IGNORECASE):
            current_sentence += part
            
            # Check word count
            word_count = len(current_sentence.strip().split())
            
            if word_count > min_words:
                sentences.append(current_sentence.strip())
                current_sentence = ""
        else:
            current_sentence += part
            
    if current_sentence.strip():
        sentences.append(current_sentence.strip())
        
    return sentences

if __name__ == "__main__":

    text = "Theo đại diện chủ đầu tư, đến tháng 5, website dự án có gần 70.000 lượt truy cập ,báo hiệu tỷ lệ chọi rất cao vào đợt mở bán sắp tới. Đây cũng là dự án có giá cao nhất tại Hà Nội từ trước đến nay, với mức dự kiến khoảng 27 triệu đồng một m2. Như vậy, mỗi căn hộ tại đây dao động từ 864 triệu đồng (căn 32 m2) đến 2 tỷ (77 m2)"
    for  s in vietnamese_tokenizer(text):
        print(s)