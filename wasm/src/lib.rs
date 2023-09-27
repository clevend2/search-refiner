mod utils;

extern crate tokenizers;

use std::collections::HashMap;

use serde::{Serialize, Deserialize};

use tokenizers::{decoders};
use tokenizers::normalizers::bert::BertNormalizer;
use tokenizers::pre_tokenizers::bert::BertPreTokenizer;
use tokenizers::processors::bert::BertProcessing;
use tokenizers::tokenizer::{EncodeInput, Encoding, Offsets, Tokenizer};
use tokenizers::models::wordpiece::WordPiece;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[derive(Serialize, Deserialize)]
pub struct JsEncoding {
    /// IDs produced by the `Tokenizer`
    ids: Vec<u32>,
    /// Type of the IDs
    type_ids: Vec<u32>,
    /// Tokens associated to each ID
    tokens: Vec<String>,
    /// Indice of the word associated to each token/ID
    words: Vec<Option<u32>>,
    /// Offsets of the token/ID from the NormalizedString
    offsets: Vec<Offsets>,
    /// Mask identifying special tokens
    special_tokens_mask: Vec<u32>,
    /// Mask identifying padding tokens for the attention mechanism
    attention_mask: Vec<u32>
}

#[wasm_bindgen]
pub fn tokenize(vocab_str: &str, text: &str) -> JsValue {
    let mut vocab = HashMap::new();
    
    for (index, line) in vocab_str.lines().enumerate() {
      vocab.insert(line.trim_end().to_owned(), index as u32);
    }

    let word_piece_build = WordPiece::builder().vocab(vocab).build();
    
    return match word_piece_build {
      Ok(wordpiece) => {
        let mut bert_tokenizer = Tokenizer::new(Box::new(wordpiece));
        
        let normalizer = BertNormalizer::new(true, false, true, true);

        let pre_tokenizer = BertPreTokenizer;

        let post_processor = BertProcessing::new(("[SEP]".to_string(), 1), ("[CLS]".to_string(), 2));

        let decoder = decoders::wordpiece::WordPiece::new("##".to_string(), true);

        bert_tokenizer.with_normalizer(Box::new(normalizer));
        bert_tokenizer.with_pre_tokenizer(Box::new(pre_tokenizer));
        bert_tokenizer.with_post_processor(Box::new(post_processor));
        bert_tokenizer.with_decoder(Box::new(decoder));
    
        let encoding = bert_tokenizer.encode(EncodeInput::Single(text.to_string()), false);

        JsValue::from_serde::<JsEncoding>(&js_from_encoding(&encoding.unwrap())).unwrap()
      }
      Err(e) => {
        println!("ERROR: {:?}", e.to_string());

        JsValue::from_str(&e.source().unwrap().to_string())
      }
    }
}

fn js_from_encoding (encoding: &Encoding) -> JsEncoding {
  JsEncoding { 
    ids: encoding.get_ids().to_vec(), 
    type_ids: encoding.get_type_ids().to_vec(), 
    tokens: encoding.get_tokens().to_vec(), 
    words: encoding.get_words().to_vec(), 
    offsets: encoding.get_offsets().to_vec(), 
    special_tokens_mask: encoding.get_special_tokens_mask().to_vec(), 
    attention_mask: encoding.get_attention_mask().to_vec()
  }
}

#[cfg(test)]
mod tests {
  use super::tokenize;

  #[test]
  pub fn run() {
    assert_eq!(1, 1)
  } 
}
