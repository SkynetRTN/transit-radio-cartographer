use serde::{Deserialize,Serialize};
#[derive(Debug,Serialize,Deserialize)] pub struct MenuRequest{pub path:String}
#[derive(Debug,Serialize,Deserialize)] pub struct RpcEnvelope{pub method:String,pub params:MenuRequest}
pub fn new_survey_request(path:String)->RpcEnvelope{RpcEnvelope{method:"open_survey".into(),params:MenuRequest{path}}}
