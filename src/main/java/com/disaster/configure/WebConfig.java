package com.disaster.configure;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer{

	@Value("${file.upload.path}")
	String uploadpaPath;
	
	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		registry.addResourceHandler("/upload/disaster/**")
		.addResourceLocations("file:C:/upload/disaster/");	
		registry.addResourceHandler("/summer/**")
        .addResourceLocations("file:C:/upload/disaster/");
		
	}
	
}
